const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  // Inicializamos el navegador otorgando permisos de micrófono
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    permissions: ['microphone'],
    args: [
      '--use-fake-ui-for-media-stream', // Acepta automáticamente solicitudes de pantalla/micrófono
      '--use-fake-device-for-media-stream' // Utiliza dispositivos falsos para simulación
    ],
  });

  // Abrimos una nueva página en el contexto con permisos
  const page = await context.newPage();

  // Crear carpeta de logs si no existe
  const logsDir = path.join(__dirname, 'Logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  // Determinar el nombre del archivo de log
  let logIndex = 1;
  while (fs.existsSync(path.join(logsDir, `Mails_Test_${logIndex}.logs`))) {
    logIndex++;
  }
  const logFilePath = path.join(logsDir, `Mails_Test_${logIndex}.logs`);

  // Crear el archivo de log y escribir el encabezado artístico
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
  logStream.write(`
         @@                                                       
       @@@@                                                       
    @@@@@@                                                        
   @@@@@@@                                                        
   @@@@@@@                           @                            
 @@@@@@@@@@                         @@                            
@@@@@@@@@@@                         @@                            
@@@@@@@@@@@@                       @@                             
@@@@@@@@@@@@@                    @@@@                             
@@@@@@@@@@@@@@@                 @@@@                              
 @@@@@@@@@@@@@@@@            @@@@@                                
  @@@@@@@@@@@@@@@@@@@@ @@@@@@@@@                                  
    @@@@@@@@@@@@@@@@@@@@@@@@@                                      
        @@@@@@@@@@@@@@@@@@@@@                                      
      @@@@@@@@@@@@@@@@@@@@@@@@                                     
    @@@@@@@@@@@@          @@@@    @@@                          @@@ 
@@@@@@@@@@@@@@            @@       @   @@                      @@@ 
     @@@@ @@@     @@@@@@ @@@@@    @@@ @@@@@@  @@@@@  @@@@@@    @@@ 
          @@    @@@@@@@@@@@@@@@@  @@@ @@@@@@ @@@@@@@@@@@@@@@@@ @@@ 
                @@@    @@@   @@@  @@@ @@@    @@@  @@@      @@@ @@@ 
                @@@    @@@   @@@@ @@@ @@@    @@@  @@@      @@@@@@@ 
                @@@    @@@   @@@@ @@@ @@@    @@@  @@@      @@@@@@@ 
                @@@    @@@   @@@@ @@@ @@@@   @@@  @@@@@  @@@@@ @@@ 
                @@@    @@@   @@@  @@@  @@@@@ @@@    @@@@@@@@@  @@@ 

`);
  logStream.write(`=== Iniciando ejecución de envío de correos ===\n`);
  logStream.write(`Fecha y hora de inicio: ${new Date().toLocaleString()}\n\n`);

  let mailCount = 0;

  // Navegamos a la URL de Webpad
  await page.goto('https://co-dev-wpad.mitrol.net/webpad/');

  // Ingresamos las credenciales
  await page.fill('input#username.form-control', 'admin01');
  await page.fill('input#password.form-control', 'admin01');
  await page.click('#kc-login');

  // Esperamos a que cargue la página posterior al login
  await page.waitForTimeout(3000);

  // Usamos xdotool para interactuar con el cuadro de compartir pantalla
  try {
    // Pausa para asegurarse de que el cuadro de diálogo está visible
    await page.waitForTimeout(2000);

    // Ejecutamos comandos con xdotool para seleccionar opciones y hacer clic en "Compartir"
    execSync('xdotool mousemove 500 400 click 1'); // Mueve el mouse a "Toda la pantalla" y hace clic
    await page.waitForTimeout(500); // Pausa para que la opción esté seleccionada
    execSync('xdotool mousemove 500 600 click 1'); // Mueve el mouse a "Pantalla 1" y hace clic
    await page.waitForTimeout(500); // Pausa para que la pantalla esté seleccionada
    execSync('xdotool mousemove 800 800 click 1'); // Mueve el mouse al botón "Compartir" y hace clic

    logStream.write(`Pantalla compartida exitosamente\n`);
  } catch (error) {
    logStream.write(`Error al interactuar con el cuadro de compartir pantalla: ${error}\n`);
  }

  // Esperamos un momento para asegurarnos de que la pantalla esté compartida y la interfaz esté lista
  await page.waitForTimeout(2000);

  // Bucle para repetir los pasos 4 en adelante
  while (true) {
    try {
      // Paso 4: Abrir la sección de envío de correos
      await page.click('#newMail > span');
      logStream.write(`[${new Date().toLocaleTimeString()}] Sección de envío de correos abierta exitosamente\n`);

      // Esperamos para asegurarnos de que la sección de "Nuevo Mail" esté abierta
      await page.waitForTimeout(2000);

      // Paso 5: Llenar el campo "Para:" simulando tipeo con un delay más corto
      const paraInputSelector = '#mail-composer > div:nth-child(2) > div.col-xs-12 > div > div > div > div > div:nth-child(1) > input';
      await page.fill(paraInputSelector, '');
      await page.click(paraInputSelector);
      await page.type(paraInputSelector, 'implementation.mitrol@gmail.com', { delay: 50 }); // Delay reducido a 50 ms
      await page.waitForTimeout(1000);

      // Intentamos seleccionar la sugerencia usando la tecla "Enter"
      await page.keyboard.press('ArrowDown'); // Mover hacia la sugerencia
      await page.keyboard.press('Enter'); // Seleccionar la sugerencia
      logStream.write(`[${new Date().toLocaleTimeString()}] Campo 'Para:' llenado y dirección seleccionada correctamente\n`);

      // Paso 6: Llenar el campo "Asunto"
      const subjectInputSelector = '#mail-composer > div:nth-child(2) > div:nth-child(4) > div > div > div > input';
      await page.fill(subjectInputSelector, 'Test de Mail');
      logStream.write(`[${new Date().toLocaleTimeString()}] Campo 'Asunto:' llenado correctamente\n`);

      // Paso 7: Llenar el cuerpo del mensaje usando un selector más específico
      const bodySelector = 'div[contenteditable="true"][ng-model="html"]';
      await page.fill(bodySelector, 'Mail de prueba');
      logStream.write(`[${new Date().toLocaleTimeString()}] Cuerpo del mail llenado correctamente\n`);

      // Paso 8: Hacer clic en el botón "Enviar"
      const sendButtonSelector = '#mail-composer > div:nth-child(5) > div > div > button:nth-child(3)';
      await page.click(sendButtonSelector);
      logStream.write(`[${new Date().toLocaleTimeString()}] Correo enviado exitosamente\n`);

      // Paso 9: Hacer clic en el botón "Aceptar" para confirmar el envío
      const acceptButtonSelector = '#confirmAcceptButton';
      await page.waitForSelector(acceptButtonSelector);
      await page.click(acceptButtonSelector);
      logStream.write(`[${new Date().toLocaleTimeString()}] Confirmación de envío aceptada\n`);

      mailCount++;
      logStream.write(`--- Fin de bucle ${mailCount} ---\n\n`);

      // Esperamos un momento antes de empezar de nuevo
      await page.waitForTimeout(5000); // Esperar 5 segundos antes de repetir
    } catch (error) {
      logStream.write(`Error en el bucle de envío de correos: ${error}\n`);
      break; // Salimos del bucle si hay un error que no podamos resolver
    }
  }

  // Escribimos el resumen final en el archivo de log
  logStream.write(`Total de correos enviados exitosamente: ${mailCount}\n`);
  logStream.write(`Fecha y hora de finalización: ${new Date().toLocaleString()}\n`);
  logStream.write(`=== Fin de la ejecución ===\n`);
  logStream.end();

  // Cerramos el navegador si es necesario
  // await context.close();
})();
