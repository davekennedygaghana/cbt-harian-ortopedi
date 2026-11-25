/** @type {import('next').NextConfig} */
// output 'export' → build menghasilkan folder statis `out/` yang bisa di-host di mana pun.
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
