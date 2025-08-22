/** @type {import('next-sitemap').IConfig} */
const config = {
    siteUrl: 'https://tar.ad',
    robotsTxtOptions: {
      policies: [
        {
          userAgent: '*',
          disallow: ['/admin', '/checkout', '/account', '/backend', '/api/*',],
        },
        { userAgent: '*', allow: '/' },
      ],
      additionalSitemaps: [
        'https://tar.ad/sitemap.xml', // If you have other static sitemaps
      ],
    },
    // ...other options
  };
  
  module.exports = config;