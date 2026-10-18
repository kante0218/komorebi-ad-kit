import { useEffect, useRef } from 'react';

// endpoint はサービスの公開 HTTPS オリジンに置き換えます。
export default function AdSlot({ slotId, size = 'card', endpoint = 'http://localhost:8080', embedPath = '/embed.js', demo = true }) {
  const root = useRef(null);
  useEffect(() => {
    const target = root.current;
    const script = document.createElement('script');
    script.async = true;
    script.src = new URL(embedPath, endpoint).href;
    script.dataset.endpoint = endpoint;
    script.dataset.slot = slotId;
    script.dataset.size = size;
    script.dataset.demo = String(demo);
    target.appendChild(script);
    return () => target.replaceChildren();
  }, [slotId, size, endpoint, embedPath, demo]);
  return <div ref={root} />;
}

// <AdSlot slotId="demo_card" size="card" />
