import net from 'node:net';
import { spawn } from 'node:child_process';
import { createAiArenaServer } from './server.mjs';

const PORT = Number(process.env.PORT || 3300);

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createConnection({ port, host: '127.0.0.1' });
    tester.once('connect', () => {
      tester.destroy();
      resolve(true);
    });
    tester.once('error', () => {
      resolve(false);
    });
  });
}

const IGNORED_HOSTS = new Set([
  'https://admin.localhost.run',
  'https://console.serveo.net',
  'https://localhost.run',
  'https://serveo.net',
  'https://pinggy.io',
  'https://dashboard.pinggy.io'
]);

function startSshTunnel(name, args, urlRegex) {
  const proc = spawn('ssh', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const announced = new Set();

  const handleOutput = (chunk) => {
    const raw = chunk.toString('utf8');
    // Strip ANSI escape sequences so URL regex matches cleanly
    const text = raw.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
    const matches = text.match(urlRegex) || [];
    for (const url of matches) {
      if (IGNORED_HOSTS.has(url)) continue;
      if (!announced.has(url)) {
        announced.add(url);
        console.log(`\n====================================================================`);
        console.log(`🎉 [${name}] ĐÃ CẤP PHÁT TÊN MIỀN HTTPS TRỰC TUYẾN THÀNH CÔNG!`);
        console.log(`🌍 TÊN MIỀN GAME 3D: ${url}`);
        console.log(`📱 Mở ngay đường link trên bằng Điện Thoại (4G/5G/Wi-Fi) hoặc Máy Tính!`);
        console.log(`====================================================================\n`);
      }
    }
  };

  proc.stdout.on('data', handleOutput);
  proc.stderr.on('data', handleOutput);
  proc.on('error', () => {});
  return proc;
}

async function main() {
  const alreadyListening = await checkPortInUse(PORT);
  if (!alreadyListening) {
    const { server } = createAiArenaServer();
    await new Promise((resolve) => {
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 [LOCAL SERVER] ĐẤU TRƯỜNG AI – AI ARENA 3.0 đang chạy tại http://localhost:${PORT}`);
        resolve();
      });
    });
  } else {
    console.log(`✅ [LOCAL SERVER] Phát hiện cổng ${PORT} đang hoạt động tại http://localhost:${PORT}`);
  }

  console.log(`🌐 Đang cấp phát đồng thời các Tên Miền HTTPS Công Khai (Multi-Domain Gateways)...`);

  // 1. Fixed Custom Subdomain on Serveo (https://ai-arena-skyline.serveousercontent.com)
  const customSubdomain = process.env.AI_ARENA_SUBDOMAIN || 'ai-arena-skyline';
  startSshTunnel(
    'FIXED SERVEO DOMAIN',
    [
      '-T',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ServerAliveInterval=30',
      '-R', `${customSubdomain}:80:127.0.0.1:${PORT}`,
      'serveo.net'
    ],
    /https:\/\/[a-zA-Z0-9.-]+\.(?:serveo\.net|serveousercontent\.com)/g
  );

  // 1B. Backup Serveo Domain
  startSshTunnel(
    'SERVEO.NET BACKUP DOMAIN',
    [
      '-T',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ServerAliveInterval=30',
      '-R', `80:127.0.0.1:${PORT}`,
      'serveo.net'
    ],
    /https:\/\/[a-zA-Z0-9.-]+\.(?:serveo\.net|serveousercontent\.com)/g
  );

  // 2. Pinggy Cloud Domain (https://*.a.pinggy.link)
  startSshTunnel(
    'PINGGY.LINK DOMAIN',
    [
      '-T',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ServerAliveInterval=30',
      '-p', '443',
      `-R0:127.0.0.1:${PORT}`,
      'a.pinggy.io'
    ],
    /https:\/\/[a-zA-Z0-9.-]+\.pinggy\.(?:link|online)/g
  );

  // 3. Localhost.run Domain (https://*.lhr.life)
  startSshTunnel(
    'LHR.LIFE DOMAIN',
    [
      '-T',
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ServerAliveInterval=30',
      '-R', `80:127.0.0.1:${PORT}`,
      'nokey@localhost.run'
    ],
    /https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/g
  );
}

main().catch((err) => {
  console.error('Lỗi khởi tạo tên miền:', err);
  process.exit(1);
});
