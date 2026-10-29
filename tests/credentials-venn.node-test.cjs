const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const source = readFileSync(require.resolve('../credentials-venn.js'), 'utf8');

function setup({ reduced = false, observerAvailable = true } = {}) {
  const classes = new Set();
  const circles = Array.from({ length: 4 }, () => ({
    delay: null,
    style: { setProperty(_, value) { this.owner.delay = value; } }
  }));
  circles.forEach(circle => { circle.style.owner = circle; });
  const diagram = {
    querySelectorAll: () => circles,
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) }
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
  // A repeated random draw deliberately exercises the no-repeat guard on return visits.
  const math = Object.create(Math);
  math.random = () => .5;
  runInNewContext(source, { window, document: { querySelector: () => diagram },
    IntersectionObserver: window.IntersectionObserver, Math: math });
  return { classes, circles, observers, media, handlers, delays: () => circles.map(circle => circle.delay) };
}

test('entry staggers all four circles; small scroll changes do not restart the reveal', () => {
  const state = setup();
  const observer = state.observers[0];
  observer.enter(.1);
  assert.equal(state.classes.has('is-revealing'), false);
  observer.enter(.3);
  assert.equal(state.classes.has('is-revealing'), true);
  assert.deepEqual([...state.delays()].sort((a, b) => parseInt(a) - parseInt(b)), ['160ms', '760ms', '1360ms', '1960ms']);
  const first = state.delays();
  observer.enter(.8);
  observer.enter(.1);
  observer.enter(.4);
  assert.deepEqual(state.delays(), first);
});

test('leaving cancels the sequence; returning changes the order even if randomness repeats', () => {
  const state = setup();
  const observer = state.observers[0];
  observer.enter(.3);
  const first = state.delays();
  observer.enter(0);
  assert.equal(state.classes.has('is-revealing'), false);
  observer.enter(.3);
  assert.equal(state.classes.has('is-revealing'), true);
  assert.notDeepEqual(state.delays(), first);
});

test('reduced motion is immediate, including when enabled during a pending reveal', () => {
  const state = setup();
  state.observers[0].enter(.3);
  state.media.matches = true;
  state.media.change();
  assert.equal(state.observers[0].disconnected, true);
  assert.equal(state.classes.has('reveal-ready'), false);
  assert.equal(state.classes.has('is-revealing'), false);
  state.observers[0].enter(.3);
  assert.equal(state.classes.has('is-revealing'), false);
  state.media.matches = false;
  state.media.change();
  assert.equal(state.classes.has('reveal-ready'), true);
  state.observers.at(-1).enter(.3);
  assert.equal(state.classes.has('is-revealing'), true);
});

test('motion preference and unsupported observers leave content visible by default', () => {
  for (const options of [{ reduced: true }, { observerAvailable: false }]) {
    const state = setup(options);
    assert.equal(state.classes.size, 0);
    assert.equal(state.observers.length, 0);
  }
});

test('restoring from browser history arms a fresh reveal', () => {
  const state = setup();
  state.observers[0].enter(.3);
  const first = state.delays();
  state.handlers.pageshow({ persisted: true });
  assert.equal(state.observers[0].disconnected, true);
  assert.equal(state.classes.has('is-revealing'), false);
  state.observers.at(-1).enter(.3);
  assert.notDeepEqual(state.delays(), first);
});
