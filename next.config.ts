import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers(){return [{source:'/data/:path*',has:[{type:'query' as const,key:'v',value:'[a-f0-9]{12}'}],headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}];},
  devIndicators: false,
};

export default nextConfig;
