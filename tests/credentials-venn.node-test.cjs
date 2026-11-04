const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(require.resolve('../credentials-venn.js'), 'utf8');

function setup({ reduced = false, observerAvailable = true } = {}) {
  const classes = new Set();
  let staggerWrites = 0;
  let randomDraws = 0;
  const circles = Array.from({ length: 4 }, () => ({
    delay: null,
    style: { setProperty(_, value) { this.owner.delay = value; staggerWrites++; } }
  }));
  circles.forEach(circle => { circle.style.owner = circle; });
  const details = circles.map(() => ({ style: { setProperty(_, value) { this.delay = value; } } }));
  const labels = circles.map(() => ({ style: { setProperty(_, value) { this.delay = value; } } }));
  const overlaps = ['0 1', '0 2', '1 3', '2 3', '0 1 2', '0 1 3', '0 2 3', '1 2 3', '0 1 2 3'].map(members => ({
    dataset: { overlapCircles: members },
    style: { setProperty(_, value) { this.delay = value; } }
  }));
  const graphic = {};
  const diagram = {
    querySelector: selector => selector === 'svg' ? graphic : null,
    querySelectorAll: selector => ({
      '[data-credential-circle]': circles,
      '[data-credential-detail]': details,
      '[data-credential-label]': labels,
      '[data-overlap-circles]': overlaps
    })[selector],
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name))
    }
  };
  const observers = [];
  const handlers = {};
  const media = { matches: reduced, addEventListener(_, handler) { this.change = handler; } };
  const window = {
    matchMedia: () => media,
    addEventListener: (name, callback) => { handlers[name] = callback; }
  };
  if (observerAvailable) {
    window.IntersectionObserver = class {
      constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
      enter(ratio) { this.callback([{ target: this.target, isIntersecting: ratio > 0, intersectionRatio: ratio }]); }
    };
  }
  // Fix the draw so the initial randomized stagger is reproducible.
  const math = Object.create(Math);
  math.random = () => { randomDraws++; return .5; };
  runInNewContext(source, { window, document: { querySelector: () => diagram },
    IntersectionObserver: window.IntersectionObserver, Math: math });
  return { classes, circles, details, labels, overlaps, graphic, observers, media, handlers,
    delays: () => circles.map(circle => circle.delay), staggerWrites: () => staggerWrites, randomDraws: () => randomDraws };
}

test('entry staggers all four circles; small scroll changes do not restart the reveal', () => {
  const state = setup();
  const observer = state.observers[0];
  assert.equal(observer.target, state.graphic, 'the graphic, rather than the potentially tall label key, triggers the reveal');
  observer.enter(.1);
  assert.equal(state.classes.has('is-revealing'), false);
  observer.enter(.3);
  assert.equal(state.classes.has('is-revealing'), true);
  assert.deepEqual([...state.delays()].sort((a, b) => parseInt(a) - parseInt(b)), ['160ms', '760ms', '1360ms', '1960ms']);
  assert.ok(state.randomDraws() > 0, 'the first reveal retains its randomized order');
  const first = state.delays();
  observer.enter(.8);
  observer.enter(.2);
  observer.enter(.4);
  assert.deepEqual(state.delays(), first);
  assert.equal(state.staggerWrites(), 4);
});

test('a full exit and return keep the reveal visible without assigning another sequence', () => {
  const state = setup();
  const observer = state.observers[0];
  observer.enter(.3);
  const first = state.delays();
  observer.enter(0);
  assert.equal(state.classes.has('is-revealing'), true);
  observer.enter(.3);
  assert.equal(state.classes.has('is-revealing'), true);
  assert.deepEqual(state.delays(), first);
  assert.equal(state.staggerWrites(), 4);
});

test('reduced motion makes the reveal static and switching back does not restart it', () => {
  const state = setup();
  state.observers[0].enter(.3);
  const first = state.delays();
  state.media.matches = true;
  state.media.change();
  assert.equal(state.observers[0].disconnected, true);
  assert.equal(state.classes.has('reveal-ready'), false);
  assert.equal(state.classes.has('is-revealing'), false);
  state.observers[0].enter(.3);
  assert.equal(state.classes.has('is-revealing'), false);
  state.media.matches = false;
  state.media.change();
  assert.equal(state.classes.has('reveal-ready'), false);
  state.observers.at(-1).enter(.3);
  assert.equal(state.classes.has('is-revealing'), false);
  assert.deepEqual(state.delays(), first);
  assert.equal(state.staggerWrites(), 4);
});

test('motion preference and unsupported observers leave content visible by default', () => {
  for (const options of [{ reduced: true }, { observerAvailable: false }]) {
    const state = setup(options);
    assert.equal(state.classes.size, 0);
    assert.equal(state.observers.length, 0);
    if (options.reduced) {
      state.media.matches = false;
      state.media.change();
      assert.equal(state.classes.size, 0, 'initially readable content must not become hidden');
      assert.equal(state.observers.length, 0);
      assert.equal(state.staggerWrites(), 0);
    }
  }
});

test('restoring from browser history preserves the existing reveal for this page visit', () => {
  const state = setup();
  state.observers[0].enter(.3);
  const first = state.delays();
  state.handlers.pageshow({ persisted: true });
  assert.equal(state.observers[0].disconnected, true);
  assert.equal(state.classes.has('is-revealing'), true);
  state.observers.at(-1).enter(.3);
  assert.deepEqual(state.delays(), first);
  assert.equal(state.staggerWrites(), 4);
});


test('a small visible edge retains the settled reveal without changing its order', () => {
  const state = setup();
  const observer = state.observers[0];
  observer.enter(.3);
  const first = state.delays();
  observer.enter(.14);
  assert.equal(state.classes.has('is-revealing'), true);
  assert.deepEqual(state.delays(), first);
  observer.enter(.2);
  assert.equal(state.classes.has('is-revealing'), true);
  observer.enter(.3);
  assert.equal(state.classes.has('is-revealing'), true);
  assert.deepEqual(state.delays(), first);
});

test('labels follow their circle and intersection colours wait for all contributing circles', () => {
  const state = setup();
  state.observers[0].enter(.3);
  state.details.forEach((detail, index) => assert.equal(detail.style.delay, state.circles[index].delay));
  state.labels.forEach((label, index) => assert.equal(label.style.delay, state.circles[index].delay));
  state.overlaps.forEach(overlap => {
    const members = overlap.dataset.overlapCircles.split(' ').map(Number);
    const latestCircleEnd = Math.max(...members.map(index => parseInt(state.circles[index].delay))) + 867;
    assert.ok(parseInt(overlap.style.delay) > latestCircleEnd, `${members}: intersection appeared before its circles settled`);
  });
  const centreDelay = parseInt(state.overlaps.at(-1).style.delay);
  assert.ok(state.overlaps.slice(0, -1).every(overlap => parseInt(overlap.style.delay) < centreDelay));
});
