'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const TEMPLATE = path.join(__dirname, 'public', 'alpha.template.html');
const TARGET = path.join(__dirname, 'public', 'alpha.html');
const PARTS = path.join(__dirname, 'assets', 'logo');
let announced = false;

function iphoneUrls(port = Number(process.env.GCOS_PORT || 4782)) {
  const urls = [];
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses || []) {
      if (address.family === 'IPv4' && !address.internal && !address.address.startsWith('169.254.')) urls.push(`http://${address.address}:${port}/alpha`);
    }
  }
  return [...new Set(urls)];
}

function announce() {
  if (announced) return;
  announced = true;
  const urls = iphoneUrls();
  console.log('Accès sur ce PC : http://localhost:4782/alpha');
  if (urls.length) {
    console.log('Accès iPhone sur le même Wi-Fi :');
    urls.forEach((url) => console.log(`  ${url}`));
  } else {
    console.log('Accès iPhone : adresse réseau non détectée. Vérifiez que le PC est connecté au Wi-Fi.');
  }
}

function install() {
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const files = fs.readdirSync(PARTS).filter((name) => /^\d+\.txt$/.test(name)).sort();
  if (!files.length) throw new Error('OFFICIAL_LOGO_PARTS_MISSING');
  const logo = files.map((name) => fs.readFileSync(path.join(PARTS, name), 'utf8').trim()).join('');
  if (!logo.startsWith('iVBOR')) throw new Error('OFFICIAL_LOGO_INVALID');
  const output = template.replaceAll('__OFFICIAL_LOGO__', logo);
  const temp = `${TARGET}.tmp`;
  fs.writeFileSync(temp, output, 'utf8');
  fs.renameSync(temp, TARGET);
  announce();
  return { ok: true, parts: files.length, size: output.length, target: TARGET, iphoneUrls: iphoneUrls() };
}

module.exports = { install, iphoneUrls, announce, TEMPLATE, TARGET, PARTS };
