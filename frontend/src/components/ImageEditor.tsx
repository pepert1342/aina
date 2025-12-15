import React, { useState, useRef, useEffect, useCallback } from 'react';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  bold: boolean;
  italic: boolean;
  textAlign: 'left' | 'center' | 'right';
  width?: number; // Pour stocker la largeur calculée
}

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
  businessName?: string;
  initialTexts?: TextElement[];
}

const FONTS = [
  { name: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans, sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif' },
  { name: 'Playfair', value: 'Playfair Display, serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif' },
  { name: 'Oswald', value: 'Oswald, sans-serif' },
];

const COLORS = [
  '#FFFFFF', '#000000', '#FF8A65', '#004E89', '#10B981',
  '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'
];

function ImageEditor({ imageUrl, onSave, onCancel, businessName, initialTexts }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [textElements, setTextElements] = useState<TextElement[]>(initialTexts || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 400, height: 400 });
  const [scale, setScale] = useState(1); // Pour gérer le scale CSS vs Canvas
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Charger l'image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      // Adapter la taille du canvas à l'image (max 500px)
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

        ctx.fillStyle = element.backgroundColor;
        ctx.fillRect(
          bgX,
          element.y - padding,
          metrics.width + padding * 2,
          element.fontSize + padding * 2
        );
      }

      // Texte
      ctx.fillStyle = element.color;
      ctx.fillText(element.text, element.x, element.y);

      // Bordure de sélection
      if (element.id === selectedId) {
        const metrics = ctx.measureText(element.text);
        let selX = element.x;

        if (element.textAlign === 'center') {
          selX = element.x - metrics.width / 2;
        } else if (element.textAlign === 'right') {
          selX = element.x - metrics.width;
        }

        ctx.strokeStyle = '#004E89';
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
  const addText = (preset?: string) => {
    const newElement: TextElement = {
      id: Date.now().toString(),
      text: preset || 'Nouveau texte',
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      fontSize: 32,
      fontFamily: 'Poppins, sans-serif',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      bold: true,
      italic: false,
      textAlign: 'center'
    };
    setTextElements([...textElements, newElement]);
    setSelectedId(newElement.id);
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

    // Parcourir de haut en bas (dernier ajouté = au-dessus)
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

      // Zone de clic élargie
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

  // Gestion du drag - Touch (mobile)
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

    // Créer un canvas à la taille originale de l'image
    const exportCanvas = document.createElement('canvas');
    const img = imageRef.current;
    exportCanvas.width = img.width;
    exportCanvas.height = img.height;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Ratio entre canvas d'affichage et image originale
    const scaleX = img.width / canvasSize.width;
    const scaleY = img.height / canvasSize.height;

    // Dessiner l'image originale
    ctx.drawImage(img, 0, 0);

    // Dessiner les textes à l'échelle
    textElements.forEach((element) => {
      ctx.save();

      const scaledFontSize = element.fontSize * scaleX;
      const fontStyle = `${element.italic ? 'italic' : ''} ${element.bold ? 'bold' : ''} ${scaledFontSize}px ${element.fontFamily}`;
      ctx.font = fontStyle.trim();
      ctx.textAlign = element.textAlign;
      ctx.textBaseline = 'top';

      const scaledX = element.x * scaleX;
      const scaledY = element.y * scaleY;

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

        ctx.fillStyle = element.backgroundColor;
        ctx.fillRect(
          bgX,
          scaledY - padding,
          metrics.width + padding * 2,
          scaledFontSize + padding * 2
        );
      }

      // Texte
      ctx.fillStyle = element.color;
      ctx.fillText(element.text, scaledX, scaledY);

      ctx.restore();
    });

    // Exporter en PNG
    const dataUrl = exportCanvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const selectedElement = textElements.find(el => el.id === selectedId);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.9)',
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
        borderBottom: '1px solid #333'
      }}>
        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '700', margin: 0 }}>
          ✏️ Éditeur de Flyer
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
            ✓ Valider
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
          alignItems: 'center'
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
              touchAction: 'none' // Important pour le touch
            }}
          />
        </div>

        {/* Boutons d'ajout rapide */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          padding: '0 16px'
        }}>
          <button
            onClick={() => addText()}
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
              boxShadow: '0 4px 20px rgba(255, 138, 101, 0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 138, 101, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 138, 101, 0.4)';
            }}
          >
            <span style={{ fontSize: '18px' }}>✨</span> Ajouter un texte
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
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              🗑️ Supprimer
            </button>
          )}
          {textElements.length > 0 && (
            <button
              onClick={() => {
                setTextElements([]);
                setSelectedId(null);
              }}
              style={{
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)'
              }}
            >
              🔄 Tout effacer
            </button>
          )}
        </div>

        {/* Panneau d'édition */}
        {selectedElement && (
          <div style={{
            backgroundColor: '#1A1A2E',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Texte */}
            <div>
              <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Texte
              </label>
              <input
                type="text"
                value={selectedElement.text}
                onChange={(e) => updateElement(selectedId!, { text: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '2px solid #333',
                  backgroundColor: '#0D0D15',
                  color: 'white',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Taille */}
            <div>
              <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Taille: {selectedElement.fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="80"
                value={selectedElement.fontSize}
                onChange={(e) => updateElement(selectedId!, { fontSize: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: '#FF8A65' }}
              />
            </div>

            {/* Police */}
            <div>
              <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Police
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {FONTS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => updateElement(selectedId!, { fontFamily: font.value })}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: selectedElement.fontFamily === font.value ? '2px solid #FF8A65' : '2px solid #333',
                      backgroundColor: selectedElement.fontFamily === font.value ? '#FF8A6520' : 'transparent',
                      color: 'white',
                      fontFamily: font.value,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Couleur du texte */}
            <div>
              <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Couleur du texte
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateElement(selectedId!, { color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: selectedElement.color === color ? '3px solid #FF8A65' : '2px solid #333',
                      backgroundColor: color,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Couleur de fond */}
            <div>
              <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Fond du texte
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  onClick={() => updateElement(selectedId!, { backgroundColor: 'transparent' })}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: selectedElement.backgroundColor === 'transparent' ? '3px solid #FF8A65' : '2px solid #333',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '16px'
                  }}
                >
                  ∅
                </button>
                {COLORS.map((color) => (
                  <button
                    key={`bg-${color}`}
                    onClick={() => updateElement(selectedId!, { backgroundColor: color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: selectedElement.backgroundColor === color ? '3px solid #FF8A65' : '2px solid #333',
                      backgroundColor: color,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Style */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => updateElement(selectedId!, { bold: !selectedElement.bold })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: selectedElement.bold ? '2px solid #FF8A65' : '2px solid #333',
                  backgroundColor: selectedElement.bold ? '#FF8A6520' : 'transparent',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                B
              </button>
              <button
                onClick={() => updateElement(selectedId!, { italic: !selectedElement.italic })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: selectedElement.italic ? '2px solid #FF8A65' : '2px solid #333',
                  backgroundColor: selectedElement.italic ? '#FF8A6520' : 'transparent',
                  color: 'white',
                  fontStyle: 'italic',
                  cursor: 'pointer'
                }}
              >
                I
              </button>
              <button
                onClick={() => updateElement(selectedId!, { textAlign: 'left' })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: selectedElement.textAlign === 'left' ? '2px solid #FF8A65' : '2px solid #333',
                  backgroundColor: selectedElement.textAlign === 'left' ? '#FF8A6520' : 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ←
              </button>
              <button
                onClick={() => updateElement(selectedId!, { textAlign: 'center' })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: selectedElement.textAlign === 'center' ? '2px solid #FF8A65' : '2px solid #333',
                  backgroundColor: selectedElement.textAlign === 'center' ? '#FF8A6520' : 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ↔
              </button>
              <button
                onClick={() => updateElement(selectedId!, { textAlign: 'right' })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: selectedElement.textAlign === 'right' ? '2px solid #FF8A65' : '2px solid #333',
                  backgroundColor: selectedElement.textAlign === 'right' ? '#FF8A6520' : 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedId && textElements.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: '#666'
          }}>
            <p style={{ fontSize: '14px', marginBottom: '8px' }}>
              👆 Cliquez sur "Ajouter texte" pour commencer
            </p>
            <p style={{ fontSize: '12px' }}>
              Vous pourrez ensuite glisser-déposer le texte sur l'image
            </p>
          </div>
        )}

        {!selectedId && textElements.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '12px',
            color: '#666',
            fontSize: '13px'
          }}>
            💡 Cliquez sur un texte pour le modifier ou le déplacer
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageEditor;
