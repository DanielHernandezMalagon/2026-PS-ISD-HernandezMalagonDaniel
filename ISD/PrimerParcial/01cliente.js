const API_URL = "http://proyectobackcecyt9.onrender.com";

async function main() {
    
    console.log(`Cliente peticion Get -> a ${API_URL}/api/talleres`);

    const inicio = Date.now();
    const respuesta = await fetch(`${API_URL}/api/talleres`);

    const duracionMS = Date.now() - inicio;


    const cuerpo = await respuesta.json();

    console.log("Ciclo de peticion - respuesta");
    console.log(`Protocolo HTTPS sobre TCP : ${respuesta.status} ${respuesta.statusText}`);
    console.log(`Tiempo de ida y vuelta (RTT): ${duracionMS} ms`);
    console.log(JSON.stringify(cuerpo, null, 2));
}

main();