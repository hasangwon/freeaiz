// next-sitemap.config.mjs
/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: "https://proai.com",
  generateRobotsTxt: true,
  sitemapSize: 5000,
  changefreq: "daily",
  priority: 0.7,
};

export default config;
