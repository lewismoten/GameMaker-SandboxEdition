// Probe worker capabilities without opening serial devices or invoking firmware tools.
import { accessSync, constants, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, join } from 'node:path';
import { request } from 'node:https';

function accessible(path, mode) {
  try {
    accessSync(path, mode);
    return true;
  } catch {
    return false;
  }
}

function network(host) {
  return new Promise((resolve) => {
    const req = request({ hostname: host, method: 'HEAD', timeout: 5000 }, (response) => {
      response.resume();
      resolve({ host, reachable: true, status: response.statusCode });
    });
    req.on('error', (error) => resolve({ host, reachable: false, error: error.message }));
    req.on('timeout', () => req.destroy(new Error('Network probe timed out')));
    req.end();
  });
}

export async function capabilities() {
  const heavyDirectory = process.env.HEAVY_DIR ?? join(homedir(), '.cache/gamemaker-heavy');
  let heavy;
  const probe = join(heavyDirectory, `worker-probe-${process.pid}`);
  try {
    mkdirSync(heavyDirectory, { recursive: true });
    writeFileSync(probe, '', { flag: 'wx' });
    unlinkSync(probe);
    heavy = { directory: heavyDirectory, writable: true };
  } catch (error) {
    heavy = { directory: heavyDirectory, writable: false, error: error.message };
  }
  const executables = ['pio', 'platformio'].flatMap((name) => (process.env.PATH ?? '').split(delimiter).map((dir) => join(dir, name)));
  const platformioDirectory = process.env.PLATFORMIO_CORE_DIR ?? join(homedir(), '.platformio');
  const serialPorts = readdirSync('/dev')
    .filter((name) => /^(cu\.|tty\.|ttyUSB|ttyACM)/.test(name))
    .map((name) => {
      const path = join('/dev', name);
      return { path, readable: accessible(path, constants.R_OK), writable: accessible(path, constants.W_OK) };
    });
  const platformioExecutable = executables.find((path) => accessible(path, constants.X_OK)) ?? null;
  const platformioWritable = existsSync(platformioDirectory) && accessible(platformioDirectory, constants.W_OK);
  const registryNetwork = await Promise.all(['registry.npmjs.org', 'api.registry.platformio.org'].map(network));
  return {
    heavy,
    platformio: {
      executable: platformioExecutable,
      directory: platformioDirectory,
      directoryWritable: platformioWritable,
      lockAcquisition: 'unverified; no PlatformIO process started',
    },
    network: registryNetwork,
    serialPorts,
    can: [
      ...(heavy.writable ? ['Write to the shared heavy-lock directory.'] : []),
      ...registryNetwork.filter((probe) => probe.reachable).map((probe) => `Reach ${probe.host} over HTTPS.`),
    ],
    cannot: [
      ...(!heavy.writable ? ['Run heavy checks until shared-lock access is granted.'] : []),
      ...(!platformioExecutable || !platformioWritable ? ['Use PlatformIO here without resolving executable/cache access.'] : []),
      ...(!serialPorts.some((port) => port.readable && port.writable) ? ['Find a serial device with read/write permission.'] : []),
      ...registryNetwork.filter((probe) => !probe.reachable).map((probe) => `Verify HTTPS access to ${probe.host}.`),
    ],
    limits: [
      'Serial devices were not opened; access bits do not prove device availability.',
      'PlatformIO downloads and lock acquisition require a host job if unavailable.',
      'No firmware build, upload, erase, or flash was performed.',
    ],
  };
}
