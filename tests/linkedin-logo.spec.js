import {test,expect} from '@playwright/test';

test('both LinkedIn links use the user-supplied clean wordmark instead of the mixed SVG',async({page})=>{
 await page.goto('/');
 const links=page.locator('a[aria-label="Find me on LinkedIn"]');
 await expect(links).toHaveCount(2);
 await expect(page.locator('svg.social-icon--wordmark')).toHaveCount(0);
 for(const link of await links.all()){
  await expect(link).toHaveAttribute('href','https://www.linkedin.com/in/sam-o-brien-olinger-b658283a/');
  const logo=link.locator('img.social-icon--linkedin');
  await expect(logo).toHaveCount(1);
  await expect(logo).toHaveAttribute('src',/assets\/profile\/ui\/linkedin-user-logo\.svg/);
  await expect(logo).toHaveAttribute('alt','');
  await expect.poll(()=>logo.evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
 }
 const response=await page.request.get('/assets/profile/ui/linkedin-user-logo.svg');
 expect(response.ok()).toBe(true);
 expect(response.headers()['content-type']).toContain('image/svg+xml');
 const xml=await response.text();
 expect(xml).toContain('viewBox="0 0 753 190"');
 expect(xml).not.toContain('<rect');
});

test('LinkedIn wordmark links stay within the viewport on mobile and desktop',async({page})=>{
 for(const width of [320,390,768,1366]){
  await page.setViewportSize({width,height:900});
  await page.goto('/');
  const links=page.locator('a[aria-label="Find me on LinkedIn"]');
  for(const link of await links.all()){
   await link.scrollIntoViewIfNeeded();
   const geometry=await link.evaluate(element=>{
    const box=element.getBoundingClientRect();
    const image=element.querySelector('img.social-icon--linkedin');
    const logo=image.getBoundingClientRect();
    return {
      linkInside:box.width>0&&box.left>=-2&&box.right<=innerWidth+2,
      imageInside:logo.width>0&&logo.left>=box.left-2&&logo.right<=box.right+2,
      noScroll:document.documentElement.scrollWidth<=document.documentElement.clientWidth+2
    };
   });
   expect(geometry).toEqual({linkInside:true,imageInside:true,noScroll:true});
  }
 }
});
