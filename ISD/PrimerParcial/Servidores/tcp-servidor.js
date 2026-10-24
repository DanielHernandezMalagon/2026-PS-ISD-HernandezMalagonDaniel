const net = require('net');

const PUERTO = process.env.PUERTO || 5000;

const servidor = net.createServer((socket) => {
    const cliente = `${socket.remoteAddress}:${socket.remotePort}`;
    //Aqui el evento de conexion solo se dispara en el momento que cliente y servidor establecen un three way a través del handshake (el apreton de manos es el momento en que el cliente hace una petición, envia un IP, Puerto, Patagrama y saluda al servidor, el servidor responde creando la sesión)
    console.log(`[TCP] Conexion establecida con el cliente ${cliente}`);

    socket.on('data', (datos) => {
        const crudo = datos.toString();
        //TCP es un flujo de bytes entonces nosotros en el socket lo vemos a transformar en cadena
        console.log(`[TCP] Datos crudos asi crudisimos: ${datos.length} bytes: ${JSON.stringify(crudo)}`);

        const lineas = crudo.split('\n').map((l) => l.trim()).filter(Boolean);

        lineas.forEach((linea) => {
            console.log(`[TCP] Mensaje: "${linea}"`);
            socket.write(`Eco TCP: ${linea}\n`);
        });
    });

    //Estos eventos van fuera de 'data' para que se registren una sola vez por cliente
    socket.on('close', () => {
        console.log(`[TCP] Conexion cerrada con el cliente: ${cliente}`);
    });

    socket.on('error', (error) => {
        console.log(`[TCP] Error con: ${cliente}`, error.message);
    });
});

servidor.listen(PUERTO, () => {
    console.log(`Servidor inicializado en: ${PUERTO}`);
});
