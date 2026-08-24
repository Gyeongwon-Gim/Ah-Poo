import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.ahpoo.swim',
  appName: '어푸!',
  webDir: 'dist',
  server: {
    // ah-poo.kr은 Vercel에서 www.ah-poo.kr로 308 리다이렉트되는데,
    // Capacitor는 server.url의 호스트 밖으로 나가는 네비게이션을 막아서
    // 리다이렉트가 실패하고 빈 화면이 뜬다. 실제 서빙 호스트를 바로 지정한다.
    url: 'https://www.ah-poo.kr',
    cleartext: false,
  },
};

export default config;
