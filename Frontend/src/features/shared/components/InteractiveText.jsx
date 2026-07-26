import React, { useEffect, useRef } from 'react';
import '../styles/InteractiveText.scss';

const InteractiveText = () => {
  const line1 = 'BE';
  const line2 = 'HAPPY';
  const textSize = 13;
  const shadowColor = '#ec4899';
  const activeFilter = 'shadow-bottom-right';

  const textContainerRef = useRef(null);
  const svgDefsRef = useRef(null);

  const toHex = (n) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const warmColors = [
    '#ec4899',
    '#f97316',
    '#f59e0b',
    '#fb923c',
    '#f472b6',
    '#8b5cf6',
    '#38bdf8',
    '#10b981',
    '#fbbf24',
  ];

  const generateFilters = (hex) => {
    const rgb = hexToRgb(hex);
    const rgbStr = `rgb(${rgb.r},${rgb.g},${rgb.b})`;
    const colorLayers = warmColors.map(c => {
      const crgb = hexToRgb(c);
      return `rgb(${crgb.r},${crgb.g},${crgb.b})`;
    });

    return `
      <filter id="shadow-bottom-right" x="-200%" y="-200%" width="500%" height="500%">
        <feFlood flood-color="${colorLayers[0]}" result="color"/>
        <feComposite in="color" in2="SourceAlpha" operator="in" result="colored-text"/>
        <feGaussianBlur in="colored-text" stdDeviation="0.2" result="blurred"/>
        <feOffset in="blurred" dx="2" dy="2" result="shadow1"/>
        <feMerge result="shadow-chain">
          <feMergeNode in="colored-text"/>
          <feMergeNode in="shadow1"/>
        </feMerge>
        <feFlood flood-color="${colorLayers[1 % colorLayers.length]}" result="color2"/>
        <feComposite in="color2" in2="SourceAlpha" operator="in" result="colored-text2"/>
        <feOffset in="colored-text2" dx="4" dy="4" result="shadow2"/>
        <feMerge result="shadow-chain2">
          <feMergeNode in="shadow-chain"/>
          <feMergeNode in="shadow2"/>
        </feMerge>
        <feFlood flood-color="${colorLayers[2 % colorLayers.length]}" result="color3"/>
        <feComposite in="color3" in2="SourceAlpha" operator="in" result="colored-text3"/>
        <feOffset in="colored-text3" dx="8" dy="8" result="shadow3"/>
        <feMerge result="shadow-chain3">
          <feMergeNode in="shadow-chain2"/>
          <feMergeNode in="shadow3"/>
        </feMerge>
        <feFlood flood-color="${colorLayers[3 % colorLayers.length]}" result="color4"/>
        <feComposite in="color4" in2="SourceAlpha" operator="in" result="colored-text4"/>
        <feOffset in="colored-text4" dx="16" dy="16" result="shadow4"/>
        <feMerge result="shadow-chain4">
          <feMergeNode in="shadow-chain3"/>
          <feMergeNode in="shadow4"/>
        </feMerge>
        <feFlood flood-color="${colorLayers[4 % colorLayers.length]}" result="color5"/>
        <feComposite in="color5" in2="SourceAlpha" operator="in" result="colored-text5"/>
        <feOffset in="colored-text5" dx="32" dy="32" result="shadow5"/>
        <feMerge result="shadow-chain5">
          <feMergeNode in="shadow-chain4"/>
          <feMergeNode in="shadow5"/>
        </feMerge>
        <feFlood flood-color="${colorLayers[5 % colorLayers.length]}" result="color6"/>
        <feComposite in="color6" in2="SourceAlpha" operator="in" result="colored-text6"/>
        <feOffset in="colored-text6" dx="64" dy="64" result="shadow6"/>
        <feMerge result="shadow-chain6">
          <feMergeNode in="shadow-chain5"/>
          <feMergeNode in="shadow6"/>
        </feMerge>
        <feFlood flood-color="${colorLayers[6 % colorLayers.length]}" result="color7"/>
        <feComposite in="color7" in2="SourceAlpha" operator="in" result="colored-text7"/>
        <feOffset in="colored-text7" dx="128" dy="128" result="shadow7"/>
        <feMerge result="shadow-chain7">
          <feMergeNode in="shadow-chain6"/>
          <feMergeNode in="shadow7"/>
        </feMerge>
        <feFlood flood-color="${colorLayers[7 % colorLayers.length]}" result="color8"/>
        <feComposite in="color8" in2="SourceAlpha" operator="in" result="colored-text8"/>
        <feOffset in="colored-text8" dx="256" dy="256" result="shadow8"/>
        <feMerge result="shadow-chain8">
          <feMergeNode in="shadow-chain7"/>
          <feMergeNode in="shadow8"/>
        </feMerge>
        <feFlood flood-color="${colorLayers[8 % colorLayers.length]}" result="color9"/>
        <feComposite in="color9" in2="SourceAlpha" operator="in" result="colored-text9"/>
        <feOffset in="colored-text9" dx="512" dy="512" result="shadow9"/>
        <feMerge result="shadow-chain9">
          <feMergeNode in="shadow-chain8"/>
          <feMergeNode in="shadow9"/>
        </feMerge>
        <feMerge>
          <feMergeNode in="shadow-chain9"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    `;
  };

  useEffect(() => {
    if (svgDefsRef.current) {
      svgDefsRef.current.innerHTML = generateFilters(shadowColor);
    }
  }, [shadowColor]);

  return (
    <div className="interactive-text-container">
      <div className="confetti-bg"></div>
      <div className="stage">
        <div
          className="container"
          id="textContainer"
          ref={textContainerRef}
          style={{ fontSize: `${textSize}rem`, filter: `url(#${activeFilter})` }}
        >
          <div className="line-1" id="line1">{line1.toUpperCase()}</div>
          <div className="line-2" id="line2">{line2.toUpperCase()}</div>
        </div>
      </div>

      <svg className="svg-filters" aria-hidden="true" id="svgFilters">
        <defs id="svgDefs" ref={svgDefsRef}></defs>
      </svg>
    </div>
  );
};

export default InteractiveText;
