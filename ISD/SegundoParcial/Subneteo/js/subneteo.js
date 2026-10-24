// Lógica de IPv4 para conversión a binario, FLSM y VLSM.
// No toca el HTML: solo calcula. La interfaz está en app.js.

(function (global) {
  'use strict';

  // Conversión de decimal a binario, por ejemplo 192 -> 11000000
  function octetoABinario(octeto) {
    return octeto.toString(2).padStart(8, '0');
  }

  // Pasos del método de restas: 128, 64, 32, 16, 8, 4, 2, 1
  function pasosDecimalABinario(octeto) {
    const pesos = [128, 64, 32, 16, 8, 4, 2, 1];
    let resto = octeto;
    return pesos.map((peso) => {
      const bit = resto >= peso ? 1 : 0;
      if (bit) resto -= peso;
      return { peso, bit, resto };
    });
  }

  // IP como entero de 32 bits
  function ipAEntero(ip) {
    const partes = String(ip).trim().split('.');
    if (partes.length !== 4) throw new Error(`"${ip}" no es una IP válida (deben ser 4 octetos)`);
    return partes.reduce((acc, parte) => {
      if (!/^\d{1,3}$/.test(parte)) throw new Error(`"${parte}" no es un octeto, favor de verificar la IP`);
      const n = Number(parte);
      if (n > 255) throw new Error(`"${n}" es mayor que 255, no es una IP válida`);
      return acc * 256 + n; // multiplicación en vez de << para no caer en negativos
    }, 0);
  }

  function enteroAIp(n) {
    return [24, 16, 8, 0].map((d) => Math.floor(n / 2 ** d) % 256).join('.');
  }

  function ipABinario(ip) {
    return enteroAIp(ipAEntero(ip)).split('.').map(Number).map(octetoABinario).join('.');
  }

  function prefijoAMascara(prefijo) {
    return enteroAIp(prefijo === 0 ? 0 : 2 ** 32 - 2 ** (32 - prefijo));
  }

  function mascaraAPrefijo(mascara) {
    const bin = ipABinario(mascara).replace(/\./g, '');
    if (!/^1*0*$/.test(bin)) throw new Error(`"${mascara}" no es una máscara válida (los 1 deben ir seguidos)`);
    return bin.indexOf('0') === -1 ? 32 : bin.indexOf('0');
  }

  // Acepta "/26", "26" o "255.255.255.192"
  function leerPrefijo(texto) {
    const t = String(texto).trim().replace(/^\//, '');
    if (t.includes('.')) return mascaraAPrefijo(t);
    const p = Number(t);
    if (t === '' || !Number.isInteger(p) || p < 0 || p > 32) throw new Error(`"/${t}" no es un prefijo válido (0 a 32)`);
    return p;
  }

  // Clase histórica de la red según el primer octeto
  function claseDeRed(ip) {
    const primer = Math.floor(ipAEntero(ip) / 2 ** 24);
    if (primer === 0) return { clase: 'Reservada', prefijoPorDefecto: null };
    if (primer <= 126) return { clase: 'A', prefijoPorDefecto: 8 };
    if (primer === 127) return { clase: 'Loopback', prefijoPorDefecto: 8 };
    if (primer <= 191) return { clase: 'B', prefijoPorDefecto: 16 };
    if (primer <= 223) return { clase: 'C', prefijoPorDefecto: 24 };
    if (primer <= 239) return { clase: 'D (multicast)', prefijoPorDefecto: null };
    return { clase: 'E (experimental)', prefijoPorDefecto: null };
  }

  // Rangos privados RFC 1918
  function esPrivada(ip) {
    const n = ipAEntero(ip);
    const en = (red, pref) => Math.floor(n / 2 ** (32 - pref)) === Math.floor(ipAEntero(red) / 2 ** (32 - pref));
    return en('10.0.0.0', 8) || en('172.16.0.0', 12) || en('192.168.0.0', 16);
  }

  function hostsUtilizables(prefijo) {
    if (prefijo === 32) return 1;
    if (prefijo === 31) return 2;
    return 2 ** (32 - prefijo) - 2;
  }

  function describirSubred(redEntero, prefijo, nombre) {
    const tamano = 2 ** (32 - prefijo);
    const broadcast = redEntero + tamano - 1;
    const conHosts = prefijo < 31;
    return {
      nombre: nombre || '',
      red: enteroAIp(redEntero),
      prefijo,
      mascara: prefijoAMascara(prefijo),
      primerHost: enteroAIp(conHosts ? redEntero + 1 : redEntero),
      ultimoHost: enteroAIp(conHosts ? broadcast - 1 : broadcast),
      broadcast: enteroAIp(broadcast),
      hosts: hostsUtilizables(prefijo),
      tamanoBloque: tamano,
    };
  }

  // Red a la que pertenece una IP (equivale a IP AND máscara)
  function analizarIp(ip, prefijo) {
    const n = ipAEntero(ip);
    const tamano = 2 ** (32 - prefijo);
    const red = Math.floor(n / tamano) * tamano;
    return describirSubred(red, prefijo);
  }

  function validarRedBase(ip, prefijo) {
    const n = ipAEntero(ip);
    const tamano = 2 ** (32 - prefijo);
    if (n % tamano !== 0) {
      const correcta = enteroAIp(Math.floor(n / tamano) * tamano);
      throw new Error(`${ip}/${prefijo} no es una dirección de red válida. ¿Quisiste decir ${correcta}/${prefijo}?`);
    }
    return n;
  }

  // Menor n de bits de host tal que 2^n - 2 >= hosts
  function bitsParaHosts(hosts) {
    if (!Number.isInteger(hosts) || hosts < 1) throw new Error(`"${hosts}" no es un número de hosts válido`);
    let n = 2;
    while (2 ** n - 2 < hosts) n++;
    return n;
  }

  // FLSM: subredes del mismo tamaño
  // opciones = { subredes: N } o { hostsPorSubred: N }
  function subnetearFLSM(ip, prefijo, opciones) {
    const base = validarRedBase(ip, prefijo);
    let bitsPrestados;

    if (opciones.subredes) {
      if (!Number.isInteger(opciones.subredes) || opciones.subredes < 1) throw new Error('El número de subredes debe ser un entero mayor que 0');
      bitsPrestados = Math.ceil(Math.log2(opciones.subredes));
    } else if (opciones.hostsPorSubred) {
      bitsPrestados = 32 - prefijo - bitsParaHosts(opciones.hostsPorSubred);
    } else {
      throw new Error('Indica el número de subredes o de hosts por subred');
    }

    const nuevoPrefijo = prefijo + bitsPrestados;
    if (bitsPrestados < 0 || nuevoPrefijo > 30) {
      throw new Error(`No caben: harían falta /${nuevoPrefijo}, fuera del rango /${prefijo} a /30`);
    }

    const total = 2 ** bitsPrestados;
    const tamano = 2 ** (32 - nuevoPrefijo);
    const subredes = [];
    for (let i = 0; i < total; i++) {
      subredes.push(describirSubred(base + i * tamano, nuevoPrefijo, `Subred ${i + 1}`));
    }
    return { bitsPrestados, nuevoPrefijo, totalSubredes: total, hostsPorSubred: hostsUtilizables(nuevoPrefijo), subredes };
  }

  // VLSM: requerimientos = [{ nombre, hosts }, ...]
  // Se ordena de mayor a menor y a cada área se le da el bloque más chico que le alcance.
  function subnetearVLSM(ip, prefijo, requerimientos) {
    const base = validarRedBase(ip, prefijo);
    const fin = base + 2 ** (32 - prefijo);
    if (!requerimientos.length) throw new Error('Agrega al menos una subred');

    const ordenados = requerimientos
      .map((r, i) => ({ ...r, i }))
      .sort((a, b) => b.hosts - a.hosts || a.i - b.i);

    let siguiente = base;
    const subredes = ordenados.map((r) => {
      const bitsHosts = bitsParaHosts(r.hosts);
      const nuevoPrefijo = 32 - bitsHosts;
      if (nuevoPrefijo < prefijo) {
        throw new Error(`${r.nombre} (${r.hosts} hosts) necesita /${nuevoPrefijo}, más grande que toda la red /${prefijo}`);
      }
      const tamano = 2 ** bitsHosts;
      // como vamos de mayor a menor, "siguiente" siempre queda alineado al bloque
      const inicio = Math.ceil(siguiente / tamano) * tamano;
      if (inicio + tamano > fin) {
        throw new Error(`No alcanza el espacio: ${r.nombre} (${r.hosts} hosts, /${nuevoPrefijo}) ya no cabe en ${ip}/${prefijo}`);
      }
      siguiente = inicio + tamano;
      return { ...describirSubred(inicio, nuevoPrefijo, r.nombre), hostsSolicitados: r.hosts, bitsHosts };
    });

    const usadas = siguiente - base;
    return {
      subredes,
      direccionesTotales: 2 ** (32 - prefijo),
      direccionesUsadas: usadas,
      direccionesLibres: fin - siguiente,
      primerLibre: siguiente < fin ? enteroAIp(siguiente) : null,
    };
  }

  const api = {
    octetoABinario, pasosDecimalABinario, ipABinario, ipAEntero, enteroAIp, prefijoAMascara, mascaraAPrefijo,
    leerPrefijo, claseDeRed, esPrivada, hostsUtilizables, bitsParaHosts, analizarIp, subnetearFLSM, subnetearVLSM,
  };

  // Funciona como librería en el navegador (window.Subneteo) o en Node (require)
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.Subneteo = api;
})(typeof window !== 'undefined' ? window : globalThis);
