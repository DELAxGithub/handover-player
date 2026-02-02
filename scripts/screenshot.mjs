import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function takeScreenshot() {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--disable-cache']
    });
    const page = await browser.newPage();

    // Disable cache
    await page.setCacheEnabled(false);

    await page.setViewport({ width: 1440, height: 900 });

    const url = 'http://localhost:5173/?p=1e9a9779-a844-4891-8889-239c186907db&url=https%3A%2F%2Fwww.w3schools.com%2Fhtml%2Fmov_bbb.mp4';
    console.log('Navigating to:', url);

    try {
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
    } catch (e) {
        console.log('Navigation timeout, continuing...');
    }

    // Force reload to get fresh content
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));

    // Play video briefly to trigger duration update, then pause
    await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
            video.play();
        }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
            video.pause();
        }
    });
    await new Promise(r => setTimeout(r, 1000));

    // Get dimensions
    const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
        scrollHeight: document.documentElement.scrollHeight,
        bodyScrollHeight: document.body.scrollHeight
    }));
    console.log('Viewport dimensions:', dimensions);

    // Full screenshot
    const fullPath = join(__dirname, '../docs/screenshot-full.png');
    await page.screenshot({ path: fullPath, fullPage: false });
    console.log(`Full screenshot saved to: ${fullPath}`);

    // Controls area - capture the full bottom section including timeline track
    const controlsPath = join(__dirname, '../docs/screenshot-controls.png');
    await page.screenshot({
        path: controlsPath,
        clip: { x: 0, y: 700, width: 1040, height: 200 }
    });
    console.log(`Controls screenshot saved to: ${controlsPath}`);

    // Timeline specific - capture full width with more height context
    const timelinePath = join(__dirname, '../docs/screenshot-timeline.png');
    await page.screenshot({
        path: timelinePath,
        clip: { x: 0, y: 700, width: 1040, height: 150 }
    });
    console.log(`Timeline screenshot saved to: ${timelinePath}`);

    // Get computed position of timeline element
    const timelineInfo = await page.evaluate(() => {
        // Find the Timeline track container by its inline style (height: 32px, backgroundColor)
        const allDivs = document.querySelectorAll('div[style]');
        let trackContainer = null;
        for (const div of allDivs) {
            if (div.style.height === '32px' && div.style.backgroundColor) {
                trackContainer = div;
                break;
            }
        }
        const markers = trackContainer ? trackContainer.querySelectorAll('div[style*="backgroundColor"]') : [];
        const playhead = trackContainer ? trackContainer.querySelector('div[style*="white"]') : null;

        const result = {};

        // Check markers
        result.markersFound = markers.length;
        result.markers = Array.from(markers).map(m => {
            const rect = m.getBoundingClientRect();
            const style = window.getComputedStyle(m);
            return {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                bgColor: style.backgroundColor,
                display: style.display,
                visibility: style.visibility
            };
        });

        // Check playhead
        if (playhead) {
            const rect = playhead.getBoundingClientRect();
            result.playhead = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
        }

        // Check track container children - try multiple selectors
        result.trackContainerFound = trackContainer ? true : false;
        if (trackContainer) {
            result.trackContainerHTML = trackContainer.innerHTML.slice(0, 800);
            result.trackContainerChildCount = trackContainer.children.length;
            result.trackContainerStyle = trackContainer.getAttribute('style');

            const innerContent = trackContainer.querySelector('.absolute.inset-0');
            result.innerContent = innerContent ? {
                childCount: innerContent.children.length,
                innerHTML: innerContent.innerHTML.slice(0, 500)
            } : 'NOT FOUND - selector .absolute.inset-0';
        } else {
            result.trackContainerFound = 'NOT FOUND - looking for div with height:32px';
        }

        // Check video duration
        const video = document.querySelector('video');
        result.videoDuration = video ? video.duration : 'NO VIDEO';

        // Check the markers count text
        const markersText = Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes('markers'));
        result.markersText = markersText ? markersText.textContent : 'NOT FOUND';

        // Find Timeline container
        const timelineLabel = Array.from(document.querySelectorAll('span')).find(el => el.textContent === 'Timeline');
        if (timelineLabel) {
            const container = timelineLabel.closest('div[class*="flex-shrink-0"]');
            if (container) {
                const rect = container.getBoundingClientRect();
                result.container = { top: rect.top, bottom: rect.bottom, height: rect.height };

                // Get all children bounds
                const children = container.children;
                result.childrenCount = children.length;
                result.children = Array.from(children).map((child, i) => {
                    const r = child.getBoundingClientRect();
                    return { index: i, tag: child.tagName, top: r.top, bottom: r.bottom, height: r.height, className: child.className.slice(0, 50) };
                });
            }
        }

        // Also get the control area bounds
        const controlArea = document.querySelector('.bg-neutral-900\\/95');
        if (controlArea) {
            const rect = controlArea.getBoundingClientRect();
            result.controlArea = { top: rect.top, bottom: rect.bottom, height: rect.height };
        }

        return result;
    });
    console.log('Timeline element info:', JSON.stringify(timelineInfo, null, 2));

    await browser.close();
    console.log('Done!');
}

takeScreenshot().catch(console.error);
