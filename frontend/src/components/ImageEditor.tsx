import { useState, useRef, useEffect } from 'react';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  strokeColor: string;
  strokeWidth: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  bold: boolean;
  italic: boolean;
  textAlign: 'left' | 'center' | 'right';
  width?: number;
}

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
  businessName?: string;
  initialTexts?: TextElement[];
}

// Polices groupées par style
const FONT_GROUPS = {
  'Bold & Impact': [
    { name: 'Titan One', value: 'Titan One, cursive', preview: 'IMPACT' },
    { name: 'Bebas Neue', value: 'Bebas Neue, sans-serif', preview: 'TITRES' },
    { name: 'Anton', value: 'Anton, sans-serif', preview: 'ULTRA' },
    { name: 'Archivo Black', value: 'Archivo Black, sans-serif', preview: 'BOLD' },
    { name: 'Oswald', value: 'Oswald, sans-serif', preview: 'PRO' },
    { name: 'Luckiest Guy', value: 'Luckiest Guy, cursive', preview: 'FUN!' },
  ],
  'Élégant': [
    { name: 'Playfair Display', value: 'Playfair Display, serif', preview: 'Luxe' },
    { name: 'Raleway', value: 'Raleway, sans-serif', preview: 'Léger' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif', preview: 'Modern' },
    { name: 'Poppins', value: 'Poppins, sans-serif', preview: 'Clean' },
  ],
  'Script & Fun': [
    { name: 'Lobster', value: 'Lobster, cursive', preview: 'Script' },
    { name: 'Pacifico', value: 'Pacifico, cursive', preview: 'Cool' },
    { name: 'Dancing Script', value: 'Dancing Script, cursive', preview: 'Manuscrit' },
    { name: 'Satisfy', value: 'Satisfy, cursive', preview: 'Signature' },
    { name: 'Righteous', value: 'Righteous, cursive', preview: 'Rétro' },
  ],
};

// Couleurs groupées
const COLOR_GROUPS = {
  'Basiques': [
    { color: '#FFFFFF', name: 'Blanc' },
    { color: '#000000', name: 'Noir' },
  ],
  'AiNa': [
    { color: '#C84B31', name: 'Orange rouille' },
    { color: '#1A3A5C', name: 'Bleu nuit' },
    { color: '#2D5A45', name: 'Vert forêt' },
    { color: '#F4E4C9', name: 'Crème' },
  ],
  'Tendance 2024': [
    { color: '#FF6B6B', name: 'Corail' },
    { color: '#4ECDC4', name: 'Menthe' },
    { color: '#F7B731', name: 'Moutarde' },
    { color: '#FEB2B2', name: 'Rose blush' },
    { color: '#9B59B6', name: 'Violet doux' },
    { color: '#3498DB', name: 'Bleu électrique' },
    { color: '#87A878', name: 'Vert sauge' },
    { color: '#E07A5F', name: 'Terracotta' },
    { color: '#D4A59A', name: 'Nude' },
    { color: '#2C3E50', name: 'Charbon' },
  ],
};

function ImageEditor({ imageUrl, onSave, onCancel, initialTexts }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textElements, setTextElements] = useState<TextElement[]>(initialTexts || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });
  const [activeTab, setActiveTab] = useState<'text' | 'font' | 'color' | 'effects'>('text');
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Charger l'image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      const maxSize = 500;
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = width * ratio;
        height = height * ratio;
      }

      setCanvasSize({ width, height });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Redessiner le canvas
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dessiner l'image de fond
    ctx.drawImage(imageRef.current, 0, 0, canvasSize.width, canvasSize.height);

    // Dessiner tous les éléments texte
    textElements.forEach((element) => {
      ctx.save();

      // Style du texte
      const fontStyle = `${element.italic ? 'italic' : ''} ${element.bold ? 'bold' : ''} ${element.fontSize}px ${element.fontFamily}`;
      ctx.font = fontStyle.trim();
      ctx.textAlign = element.textAlign;
      ctx.textBaseline = 'top';

      // Ombre portée
      if (element.shadowEnabled) {
        ctx.shadowColor = element.shadowColor;
        ctx.shadowBlur = element.shadowBlur;
        ctx.shadowOffsetX = element.shadowOffsetX;
        ctx.shadowOffsetY = element.shadowOffsetY;
      }

      // Fond du texte si défini
      if (element.backgroundColor !== 'transparent') {
        const metrics = ctx.measureText(element.text);
        const padding = 8;
        let bgX = element.x - padding;

        if (element.textAlign === 'center') {
          bgX = element.x - metrics.width / 2 - padding;
        } else if (element.textAlign === 'right') {
          bgX = element.x - metrics.width - padding;
        }

        // Désactiver l'ombre pour le fond
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = element.backgroundColor;
        ctx.fillRect(
          bgX,
          element.y - padding,
          metrics.width + padding * 2,
          element.fontSize + padding * 2
        );

        // Réactiver l'ombre pour le texte
        if (element.shadowEnabled) {
          ctx.shadowColor = element.shadowColor;
          ctx.shadowBlur = element.shadowBlur;
          ctx.shadowOffsetX = element.shadowOffsetX;
          ctx.shadowOffsetY = element.shadowOffsetY;
        }
      }

      // Contour du texte (stroke)
      if (element.strokeWidth > 0 && element.strokeColor !== 'transparent') {
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(element.text, element.x, element.y);
      }

      // Texte
      ctx.fillStyle = element.color;
      ctx.fillText(element.text, element.x, element.y);

      // Réinitialiser l'ombre pour la bordure de sélection
      ctx.shadowColor = 'transparent';

      // Bordure de sélection
      if (element.id === selectedId) {
        const metrics = ctx.measureText(element.text);
        let selX = element.x;

        if (element.textAlign === 'center') {
          selX = element.x - metrics.width / 2;
        } else if (element.textAlign === 'right') {
          selX = element.x - metrics.width;
        }

        ctx.strokeStyle = '#FF8A65';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          selX - 4,
          element.y - 4,
          metrics.width + 8,
          element.fontSize + 8
        );
      }

      ctx.restore();
    });
  }, [imageLoaded, textElements, selectedId, canvasSize]);

  // Ajouter un nouveau texte
  const addText = () => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: 'Nouveau texte',
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      fontSize: 32,
      fontFamily: 'Bebas Neue, sans-serif',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowEnabled: false,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowBlur: 4,
      shadowOffsetX: 2,
      shadowOffsetY: 2,
      bold: false,
      italic: false,
      textAlign: 'center'
    };
    setTextElements([...textElements, newElement]);
    setSelectedId(newElement.id);
    setActiveTab('text');
  };

  // Supprimer le texte sélectionné
  const deleteSelected = () => {
    if (!selectedId) return;
    setTextElements(textElements.filter(el => el.id !== selectedId));
    setSelectedId(null);
  };

  // Mettre à jour un élément
  const updateElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  // Obtenir les coordonnées relatives au canvas
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Trouver l'élément à une position donnée
  const findElementAtPosition = (x: number, y: number): TextElement | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    for (let i = textElements.length - 1; i >= 0; i--) {
      const element = textElements[i];
      ctx.font = `${element.italic ? 'italic' : ''} ${element.bold ? 'bold' : ''} ${element.fontSize}px ${element.fontFamily}`.trim();
      const metrics = ctx.measureText(element.text);
      const textWidth = metrics.width;
      const textHeight = element.fontSize;

      let elX = element.x;
      if (element.textAlign === 'center') {
        elX = element.x - textWidth / 2;
      } else if (element.textAlign === 'right') {
        elX = element.x - textWidth;
      }

      const padding = 15;
      if (
        x >= elX - padding &&
        x <= elX + textWidth + padding &&
        y >= element.y - padding &&
        y <= element.y + textHeight + padding
      ) {
        return element;
      }
    }

    return null;
  };

  // Gestion du drag - Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    const element = findElementAtPosition(coords.x, coords.y);

    if (element) {
      setSelectedId(element.id);
      setIsDragging(true);
      setDragOffset({ x: coords.x - element.x, y: coords.y - element.y });
    } else {
      setSelectedId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    const newX = coords.x - dragOffset.x;
    const newY = coords.y - dragOffset.y;

    updateElement(selectedId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Gestion du drag - Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    const coords = getCanvasCoordinates(e);
    const element = findElementAtPosition(coords.x, coords.y);

    if (element) {
      setSelectedId(element.id);
      setIsDragging(true);
      setDragOffset({ x: coords.x - element.x, y: coords.y - element.y });
    } else {
      setSelectedId(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !selectedId) return;
    e.preventDefault();

    const coords = getCanvasCoordinates(e);
    const newX = coords.x - dragOffset.x;
    const newY = coords.y - dragOffset.y;

    updateElement(selectedId, { x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Exporter l'image finale
  const handleSave = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const exportCanvas = document.createElement('canvas');
    const img = imageRef.current;
    exportCanvas.width = img.width;
    exportCanvas.height = img.height;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const scaleX = img.width / canvasSize.width;
    const scaleY = img.height / canvasSize.height;

    ctx.drawImage(img, 0, 0);

    textElements.forEach((element) => {
      ctx.save();

      const scaledFontSize = element.fontSize * scaleX;
      const fontStyle = `${element.italic ? 'italic' : ''} ${element.bold ? 'bold' : ''} ${scaledFontSize}px ${element.fontFamily}`;
      ctx.font = fontStyle.trim();
      ctx.textAlign = element.textAlign;
      ctx.textBaseline = 'top';

      const scaledX = element.x * scaleX;
      const scaledY = element.y * scaleY;

      // Ombre portée
      if (element.shadowEnabled) {
        ctx.shadowColor = element.shadowColor;
        ctx.shadowBlur = element.shadowBlur * scaleX;
        ctx.shadowOffsetX = element.shadowOffsetX * scaleX;
        ctx.shadowOffsetY = element.shadowOffsetY * scaleY;
      }

      // Fond du texte
      if (element.backgroundColor !== 'transparent') {
        const metrics = ctx.measureText(element.text);
        const padding = 8 * scaleX;
        let bgX = scaledX - padding;

        if (element.textAlign === 'center') {
          bgX = scaledX - metrics.width / 2 - padding;
        } else if (element.textAlign === 'right') {
          bgX = scaledX - metrics.width - padding;
        }

        ctx.shadowColor = 'transparent';
        ctx.fillStyle = element.backgroundColor;
        ctx.fillRect(
          bgX,
          scaledY - padding,
          metrics.width + padding * 2,
          scaledFontSize + padding * 2
        );

        if (element.shadowEnabled) {
          ctx.shadowColor = element.shadowColor;
          ctx.shadowBlur = element.shadowBlur * scaleX;
          ctx.shadowOffsetX = element.shadowOffsetX * scaleX;
          ctx.shadowOffsetY = element.shadowOffsetY * scaleY;
        }
      }

      // Contour
      if (element.strokeWidth > 0 && element.strokeColor !== 'transparent') {
        ctx.strokeStyle = element.strokeColor;
        ctx.lineWidth = element.strokeWidth * scaleX;
        ctx.lineJoin = 'round';
        ctx.strokeText(element.text, scaledX, scaledY);
      }

      // Texte
      ctx.fillStyle = element.color;
      ctx.fillText(element.text, scaledX, scaledY);

      ctx.restore();
    });

    const dataUrl = exportCanvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const selectedElement = textElements.find(el => el.id === selectedId);

  // Composant pour les boutons de couleur
  const ColorButton = ({ color, isSelected, onClick, size = 32 }: { color: string; isSelected: boolean; onClick: () => void; size?: number }) => (
    <button
      onClick={onClick}
      title={color}
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        border: isSelected ? '3px solid #FF8A65' : '2px solid #444',
        backgroundColor: color,
        cursor: 'pointer',
        transition: 'transform 0.1s',
        boxShadow: isSelected ? '0 0 8px rgba(255,138,101,0.5)' : 'none'
      }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
    />
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.95)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        backgroundColor: '#1A1A2E',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #333',
        flexShrink: 0
      }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>
          Editeur de Texte
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              border: '2px solid #666',
              borderRadius: '8px',
              color: '#999',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #10B981, #34D399)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Valider
          </button>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '16px',
        overflow: 'auto'
      }}>
        {/* Canvas */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              borderRadius: '12px',
              cursor: isDragging ? 'grabbing' : 'pointer',
              maxWidth: '100%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
              touchAction: 'none'
            }}
          />
        </div>

        {/* Boutons d'action */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <button
            onClick={addText}
            style={{
              padding: '14px 28px',
              background: 'linear-gradient(135deg, #FF8A65, #FFB088)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(255, 138, 101, 0.4)'
            }}
          >
            + Ajouter un texte
          </button>
          {selectedId && (
            <button
              onClick={deleteSelected}
              style={{
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #EF4444, #F87171)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Supprimer
            </button>
          )}
        </div>

        {/* Panneau d'édition avec onglets */}
        {selectedElement && (
          <div style={{
            backgroundColor: '#1A1A2E',
            borderRadius: '16px',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {/* Onglets */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #333',
              backgroundColor: '#0D0D15'
            }}>
              {[
                { id: 'text', label: 'Texte' },
                { id: 'font', label: 'Police' },
                { id: 'color', label: 'Couleurs' },
                { id: 'effects', label: 'Effets' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: 'none',
                    backgroundColor: activeTab === tab.id ? '#1A1A2E' : 'transparent',
                    color: activeTab === tab.id ? '#FF8A65' : '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.id ? '2px solid #FF8A65' : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px' }}>
              {/* Onglet Texte */}
              {activeTab === 'text' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                      Contenu du texte
                    </label>
                    <input
                      type="text"
                      value={selectedElement.text}
                      onChange={(e) => updateElement(selectedId!, { text: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        border: '2px solid #333',
                        backgroundColor: '#0D0D15',
                        color: 'white',
                        fontSize: '16px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                      Taille: <span style={{ color: '#FF8A65', fontWeight: '700' }}>{selectedElement.fontSize}px</span>
                    </label>
                    <input
                      type="range"
                      min="16"
                      max="120"
                      value={selectedElement.fontSize}
                      onChange={(e) => updateElement(selectedId!, { fontSize: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        height: '8px',
                        borderRadius: '4px',
                        background: `linear-gradient(to right, #FF8A65 0%, #FF8A65 ${((selectedElement.fontSize - 16) / 104) * 100}%, #333 ${((selectedElement.fontSize - 16) / 104) * 100}%, #333 100%)`,
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  {/* Style et alignement */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => updateElement(selectedId!, { bold: !selectedElement.bold })}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: selectedElement.bold ? '2px solid #FF8A65' : '2px solid #333',
                        backgroundColor: selectedElement.bold ? '#FF8A6520' : 'transparent',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      B
                    </button>
                    <button
                      onClick={() => updateElement(selectedId!, { italic: !selectedElement.italic })}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: selectedElement.italic ? '2px solid #FF8A65' : '2px solid #333',
                        backgroundColor: selectedElement.italic ? '#FF8A6520' : 'transparent',
                        color: 'white',
                        fontStyle: 'italic',
                        fontSize: '16px',
                        cursor: 'pointer'
                      }}
                    >
                      I
                    </button>
                    <div style={{ width: '1px', backgroundColor: '#333', margin: '0 4px' }} />
                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateElement(selectedId!, { textAlign: align })}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: selectedElement.textAlign === align ? '2px solid #FF8A65' : '2px solid #333',
                          backgroundColor: selectedElement.textAlign === align ? '#FF8A6520' : 'transparent',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {align === 'left' ? '< |' : align === 'center' ? '| |' : '| >'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Onglet Police */}
              {activeTab === 'font' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {Object.entries(FONT_GROUPS).map(([groupName, fonts]) => (
                    <div key={groupName}>
                      <label style={{ color: '#FF8A65', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
                        {groupName}
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {fonts.map((font) => (
                          <button
                            key={font.value}
                            onClick={() => updateElement(selectedId!, { fontFamily: font.value })}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '10px',
                              border: selectedElement.fontFamily === font.value ? '2px solid #FF8A65' : '2px solid #333',
                              backgroundColor: selectedElement.fontFamily === font.value ? '#FF8A6515' : '#0D0D15',
                              color: 'white',
                              fontFamily: font.value,
                              fontSize: '16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              minWidth: '80px'
                            }}
                          >
                            {font.preview}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Onglet Couleurs */}
              {activeTab === 'color' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Couleur du texte */}
                  <div>
                    <label style={{ color: '#FF8A65', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '12px' }}>
                      Couleur du texte
                    </label>
                    {Object.entries(COLOR_GROUPS).map(([groupName, colors]) => (
                      <div key={groupName} style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#666', fontSize: '11px', display: 'block', marginBottom: '6px' }}>
                          {groupName}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {colors.map(({ color }) => (
                            <ColorButton
                              key={color}
                              color={color}
                              isSelected={selectedElement.color === color}
                              onClick={() => updateElement(selectedId!, { color })}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Couleur de fond */}
                  <div>
                    <label style={{ color: '#FF8A65', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '12px' }}>
                      Fond du texte
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        onClick={() => updateElement(selectedId!, { backgroundColor: 'transparent' })}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          border: selectedElement.backgroundColor === 'transparent' ? '3px solid #FF8A65' : '2px solid #444',
                          backgroundColor: '#1A1A2E',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666',
                          fontSize: '18px'
                        }}
                      >
                        /
                      </button>
                      {Object.values(COLOR_GROUPS).flat().map(({ color }) => (
                        <ColorButton
                          key={`bg-${color}`}
                          color={color}
                          isSelected={selectedElement.backgroundColor === color}
                          onClick={() => updateElement(selectedId!, { backgroundColor: color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Effets */}
              {activeTab === 'effects' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Contour */}
                  <div>
                    <label style={{ color: '#FF8A65', fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '12px' }}>
                      Contour (Stroke)
                    </label>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ color: '#999', fontSize: '12px' }}>
                        Epaisseur: <span style={{ color: '#FF8A65' }}>{selectedElement.strokeWidth}px</span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={selectedElement.strokeWidth}
                        onChange={(e) => updateElement(selectedId!, { strokeWidth: parseInt(e.target.value) })}
                        style={{
                          width: '100%',
                          height: '6px',
                          borderRadius: '3px',
                          background: '#333',
                          appearance: 'none',
                          cursor: 'pointer',
                          marginTop: '8px'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {Object.values(COLOR_GROUPS).flat().slice(0, 10).map(({ color }) => (
                        <ColorButton
                          key={`stroke-${color}`}
                          color={color}
                          isSelected={selectedElement.strokeColor === color}
                          onClick={() => updateElement(selectedId!, { strokeColor: color })}
                          size={28}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Ombre portée */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <label style={{ color: '#FF8A65', fontSize: '13px', fontWeight: '600' }}>
                        Ombre portee
                      </label>
                      <button
                        onClick={() => updateElement(selectedId!, { shadowEnabled: !selectedElement.shadowEnabled })}
                        style={{
                          padding: '6px 16px',
                          borderRadius: '20px',
                          border: 'none',
                          backgroundColor: selectedElement.shadowEnabled ? '#10B981' : '#333',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {selectedElement.shadowEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {selectedElement.shadowEnabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0D0D15', borderRadius: '10px' }}>
                        <div>
                          <span style={{ color: '#999', fontSize: '11px' }}>Flou: {selectedElement.shadowBlur}px</span>
                          <input
                            type="range"
                            min="0"
                            max="20"
                            value={selectedElement.shadowBlur}
                            onChange={(e) => updateElement(selectedId!, { shadowBlur: parseInt(e.target.value) })}
                            style={{ width: '100%', height: '4px', borderRadius: '2px', background: '#333', appearance: 'none', cursor: 'pointer', marginTop: '4px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: '#999', fontSize: '11px' }}>Decalage X: {selectedElement.shadowOffsetX}px</span>
                            <input
                              type="range"
                              min="-10"
                              max="10"
                              value={selectedElement.shadowOffsetX}
                              onChange={(e) => updateElement(selectedId!, { shadowOffsetX: parseInt(e.target.value) })}
                              style={{ width: '100%', height: '4px', borderRadius: '2px', background: '#333', appearance: 'none', cursor: 'pointer', marginTop: '4px' }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ color: '#999', fontSize: '11px' }}>Decalage Y: {selectedElement.shadowOffsetY}px</span>
                            <input
                              type="range"
                              min="-10"
                              max="10"
                              value={selectedElement.shadowOffsetY}
                              onChange={(e) => updateElement(selectedId!, { shadowOffsetY: parseInt(e.target.value) })}
                              style={{ width: '100%', height: '4px', borderRadius: '2px', background: '#333', appearance: 'none', cursor: 'pointer', marginTop: '4px' }}
                            />
                          </div>
                        </div>
                        <div>
                          <span style={{ color: '#999', fontSize: '11px', display: 'block', marginBottom: '6px' }}>Couleur de l'ombre</span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.8)', '#000000', '#1A3A5C', '#C84B31'].map((shadowColor) => (
                              <button
                                key={shadowColor}
                                onClick={() => updateElement(selectedId!, { shadowColor })}
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: '6px',
                                  border: selectedElement.shadowColor === shadowColor ? '2px solid #FF8A65' : '2px solid #444',
                                  backgroundColor: shadowColor.startsWith('rgba') ? '#000' : shadowColor,
                                  opacity: shadowColor.startsWith('rgba') ? parseFloat(shadowColor.match(/[\d.]+(?=\))/)?.[0] || '1') * 2 : 1,
                                  cursor: 'pointer'
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedId && textElements.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '30px 20px',
            color: '#666'
          }}>
            <p style={{ fontSize: '15px', marginBottom: '8px' }}>
              Cliquez sur "Ajouter un texte" pour commencer
            </p>
            <p style={{ fontSize: '13px' }}>
              Glissez-deposez ensuite le texte sur l'image
            </p>
          </div>
        )}

        {!selectedId && textElements.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '16px',
            color: '#666',
            fontSize: '14px'
          }}>
            Cliquez sur un texte pour le modifier ou le deplacer
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageEditor;
