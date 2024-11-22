const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
    const logFilePath = path.join(__dirname, 'button_clicks.log');
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.goto('https://apps-wmms.mitrol.cloud/webpad/');

    const buttonSelector = 'text=Finalizar';
    let clickCount = 0;

    // Espera hasta que el botón haya sido presionado manualmente por primera vez
    await page.waitForSelector(buttonSelector, { state: 'attached' });
    console.log('Por favor, presiona el botón "Finalizar" manualmente la primera vez.');
    await page.waitForTimeout(5000); // Da un margen de tiempo para que puedas hacer el primer clic

    // Luego de presionar manualmente, empieza el clic automático
    console.log('Automatización iniciada.');
    while (true) {
        try {
            await page.click(buttonSelector);
            clickCount++;
            const logMessage = `Botón pulsado automáticamente - Conteo: ${clickCount}\n`;
            console.log(logMessage);
            
            // Escribir en el archivo de logs
            fs.appendFileSync(logFilePath, logMessage);
            
            await page.waitForTimeout(1500); // Espera 1.5 segundos antes de pulsarlo nuevamente
        } catch (error) {
            const errorMessage = `Error al pulsar el botón: ${error}\n`;
            console.error(errorMessage);
            
            // Escribir el error en el archivo de logs
            fs.appendFileSync(logFilePath, errorMessage);
        }
    }
})();
