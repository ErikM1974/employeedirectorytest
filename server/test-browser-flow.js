const puppeteer = require('puppeteer');

async function testBrowserFlow() {
    console.log('Starting browser test...');
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Set viewport to match our app's expected size
        await page.setViewport({ width: 900, height: 600 });

        // Navigate to artwork dashboard
        console.log('\nNavigating to artwork dashboard...');
        await page.goto('http://localhost:3000/artwork');
        await page.waitForSelector('.artwork-dashboard');

        // Wait for requests to load
        console.log('\nWaiting for artwork requests to load...');
        await page.waitForSelector('.artwork-request');

        // Find request with Zip Zip Trucking
        console.log('\nLooking for Zip Zip Trucking request...');
        const requests = await page.$$('.artwork-request');
        for (const request of requests) {
            const text = await request.evaluate(el => el.textContent);
            if (text.includes('Zip Zip Trucking')) {
                console.log('Found Zip Zip Trucking request!');
                
                // Wait for image to load
                const image = await request.$('img');
                if (image) {
                    console.log('Image element found');
                    
                    // Check if image loaded successfully
                    const loaded = await image.evaluate(img => img.complete && img.naturalHeight !== 0);
                    console.log('Image loaded:', loaded);
                    
                    if (loaded) {
                        console.log('Image dimensions:', await image.evaluate(img => ({
                            width: img.naturalWidth,
                            height: img.naturalHeight
                        })));
                    }
                }

                // Try downloading
                console.log('\nTesting download...');
                const downloadButton = await request.$('.download-button');
                if (downloadButton) {
                    await downloadButton.click();
                    console.log('Download button clicked');
                }

                break;
            }
        }

        // Keep browser open for manual inspection
        console.log('\nTest complete! Browser will stay open for manual inspection.');
        console.log('Press Ctrl+C to close the browser and end the test.');

    } catch (error) {
        console.error('\nError during test:', error);
        await browser.close();
    }
}

testBrowserFlow().catch(console.error);
