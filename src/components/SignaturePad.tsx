import React, { useRef, useState, useEffect } from 'react';
import './SignaturePad.css';

interface SignaturePadProps {
  onSave: (signatureBase64: string) => void;
  onCancel?: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState('#000000'); // default to black
  const [isSaving, setIsSaving] = useState(false);
  const inkColorRef = useRef('#000000');

  // Sync ref with inkColor state
  useEffect(() => {
    inkColorRef.current = inkColor;
  }, [inkColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Utilize ResizeObserver to handle modal transitions and dynamic sizing correctly.
    // If the canvas mounts with a size of 0x0 (due to modal fade-in), this will update it
    // as soon as the element gets its actual layout dimensions.
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          // Only resize if the dimensions are actually different to prevent unnecessary clears
          if (canvas.width !== Math.floor(width) || canvas.height !== Math.floor(height)) {
            canvas.width = Math.floor(width);
            canvas.height = Math.floor(height);
            
            // Re-apply context stroke properties
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.lineWidth = 3;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
            }
          }
        }
      }
    });

    resizeObserver.observe(canvas);

    // Initial setup in case it is already sized
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Commencer le dessin (Souris)
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = inkColorRef.current;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setHasDrawn(true);
  };

  // Dessiner (Souris)
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Arrêter le dessin
  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  // Support Tactile (Mobile)
  const startDrawingTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || e.touches.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    ctx.strokeStyle = inkColorRef.current;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setHasDrawn(true);
  };

  const drawTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || e.touches.length === 0) return;
    e.preventDefault(); // Empêcher le défilement de l'écran lors du dessin

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Effacer la signature
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Sauvegarder
  const save = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn || isSaving) return;

    setIsSaving(true);
    try {
      // Exporter l'image au format Base64
      const dataUrl = canvas.toDataURL('image/png');
      await onSave(dataUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="signature-pad-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="signature-color-selector" style={{ display: 'flex', gap: '12px', marginBottom: '4px', alignItems: 'center' }}>
        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Couleur du stylo :</span>
        <button
          type="button"
          onClick={() => setInkColor('#000000')}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#000000',
            border: inkColor === '#000000' ? '2px solid var(--primary)' : '1px solid var(--steel-border)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
          disabled={isSaving}
          title="Stylo Noir"
        >
          {inkColor === '#000000' && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
        </button>
        <button
          type="button"
          onClick={() => setInkColor('#0000FF')}
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#0000FF',
            border: inkColor === '#0000FF' ? '2px solid var(--primary)' : '1px solid var(--steel-border)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}
          disabled={isSaving}
          title="Stylo Bleu"
        >
          {inkColor === '#0000FF' && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
        </button>
      </div>

      <div className="signature-canvas-wrapper" style={{ border: '1px solid var(--steel-border)', borderRadius: '8px', background: 'var(--bg-primary)', overflow: 'hidden', position: 'relative' }}>
        <canvas
          ref={canvasRef}
          className="signature-canvas"
          onMouseDown={isSaving ? undefined : startDrawing}
          onMouseMove={isSaving ? undefined : draw}
          onMouseUp={isSaving ? undefined : stopDrawing}
          onMouseLeave={isSaving ? undefined : stopDrawing}
          onTouchStart={isSaving ? undefined : startDrawingTouch}
          onTouchMove={isSaving ? undefined : drawTouch}
          onTouchEnd={isSaving ? undefined : stopDrawing}
          style={{ width: '100%', height: '180px', display: 'block', cursor: isSaving ? 'default' : 'crosshair' }}
        />
        {!hasDrawn && (
          <div className="signature-placeholder" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Dessinez votre signature ici avec votre souris ou doigt
          </div>
        )}
      </div>

      <div className="signature-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
        {onCancel && (
          <button className="btn btn-secondary signature-pad-btn" onClick={onCancel} type="button" disabled={isSaving}>
            Annuler
          </button>
        )}
        <button
          className="btn btn-secondary signature-pad-btn"
          onClick={clear}
          disabled={!hasDrawn || isSaving}
          type="button"
        >
          Effacer
        </button>
        <button
          className="btn btn-primary signature-pad-btn"
          onClick={save}
          disabled={!hasDrawn || isSaving}
          type="button"
        >
          {isSaving ? 'Validation...' : 'Valider la signature'}
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
