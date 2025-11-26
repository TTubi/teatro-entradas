import React, { useState, useEffect } from 'react';
import { Calendar, Users, Trash2, Plus, X, Save, ChevronLeft, Download, CheckSquare } from 'lucide-react';
import './App.css';

const TeatroSeatManager = () => {
  const [shows, setShows] = useState([]);
  const [currentShow, setCurrentShow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [seatModal, setSeatModal] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [newShow, setNewShow] = useState({ name: '', date: '', time: '' });

  useEffect(() => {
    loadShows();
  }, []);

  const loadShows = async () => {
    try {
      const result = await window.storage.list('show:');
      if (result && result.keys) {
        const loadedShows = await Promise.all(
          result.keys.map(async (key) => {
            const data = await window.storage.get(key);
            return data ? JSON.parse(data.value) : null;
          })
        );
        setShows(loadedShows.filter(Boolean));
      }
    } catch (error) {
      console.log('Iniciando con datos vacíos');
      setShows([]);
    }
  };

  const saveShow = async (show) => {
    await window.storage.set(`show:${show.id}`, JSON.stringify(show));
  };

  const createShow = async () => {
    if (!newShow.name || !newShow.date || !newShow.time) {
      alert('Por favor complete todos los campos');
      return;
    }

    const show = {
      id: Date.now().toString(),
      name: newShow.name,
      date: newShow.date,
      time: newShow.time,
      seats: initializeSeats(),
      createdAt: new Date().toISOString()
    };

    await saveShow(show);
    setShows([...shows, show]);
    setNewShow({ name: '', date: '', time: '' });
    setShowModal(false);
  };

  const deleteShow = async (showId) => {
    if (window.confirm('¿Está seguro de eliminar esta función?')) {
      await window.storage.delete(`show:${showId}`);
      setShows(shows.filter(s => s.id !== showId));
      if (currentShow?.id === showId) {
        setCurrentShow(null);
      }
    }
  };

  const initializeSeats = () => {
    const seats = [];
    
    const seatsPerRow = {
      1: 26, 2: 32, 3: 34, 4: 34, 5: 34, 6: 34,
      7: 32, 8: 32, 9: 28, 10: 28, 11: 24, 12: 22
    };

    for (let row = 1; row <= 12; row++) {
      const totalSeats = seatsPerRow[row];
      const seatsPerSide = totalSeats / 2;
      
      for (let i = 0; i < seatsPerSide; i++) {
        const seatNumber = (i * 2) + 1;
        seats.push({
          id: `impar-${row}-${seatNumber}`,
          sector: 'impar',
          row: row,
          number: seatNumber,
          status: 'available',
          customer: null
        });
      }
    }

    for (let row = 1; row <= 12; row++) {
      const totalSeats = seatsPerRow[row];
      const seatsPerSide = totalSeats / 2;
      
      for (let i = 0; i < seatsPerSide; i++) {
        const seatNumber = (i * 2) + 2;
        seats.push({
          id: `par-${row}-${seatNumber}`,
          sector: 'par',
          row: row,
          number: seatNumber,
          status: 'available',
          customer: null
        });
      }
    }

    return seats;
  };

  const handleSeatClick = (seat) => {
    if (multiSelectMode) {
      // Modo selección múltiple
      if (seat.status === 'sold') {
        alert('Este asiento ya está vendido');
        return;
      }
      
      const isSelected = selectedSeats.find(s => s.id === seat.id);
      if (isSelected) {
        setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
      } else {
        setSelectedSeats([...selectedSeats, seat]);
      }
    } else {
      // Modo individual
      if (seat.status === 'sold') {
        setSelectedSeats([seat]);
        setCustomerInfo(seat.customer);
        setSeatModal(true);
      } else {
        setSelectedSeats([seat]);
        setCustomerInfo({ name: '', phone: '', email: '' });
        setSeatModal(true);
      }
    }
  };

  const openMultiSellModal = () => {
    if (selectedSeats.length === 0) {
      alert('Seleccione al menos un asiento');
      return;
    }
    setCustomerInfo({ name: '', phone: '', email: '' });
    setSeatModal(true);
  };

  const saveSeatInfo = async () => {
    if (!customerInfo.name) {
      alert('Por favor complete el nombre');
      return;
    }

    const updatedSeats = currentShow.seats.map(seat => {
      const isSelected = selectedSeats.find(s => s.id === seat.id);
      if (isSelected) {
        return { ...seat, status: 'sold', customer: customerInfo };
      }
      return seat;
    });

    const updatedShow = { ...currentShow, seats: updatedSeats };
    await saveShow(updatedShow);
    setCurrentShow(updatedShow);
    setShows(shows.map(s => s.id === updatedShow.id ? updatedShow : s));
    
    setSeatModal(false);
    setSelectedSeats([]);
    setMultiSelectMode(false);
    setCustomerInfo({ name: '', phone: '', email: '' });
  };

  const freeSeat = async () => {
    if (window.confirm('¿Liberar este asiento?')) {
      const updatedSeats = currentShow.seats.map(seat => {
        const isSelected = selectedSeats.find(s => s.id === seat.id);
        if (isSelected) {
          return { ...seat, status: 'available', customer: null };
        }
        return seat;
      });

      const updatedShow = { ...currentShow, seats: updatedSeats };
      await saveShow(updatedShow);
      setCurrentShow(updatedShow);
      setShows(shows.map(s => s.id === updatedShow.id ? updatedShow : s));
      setSeatModal(false);
      setSelectedSeats([]);
    }
  };

  const generatePDFTickets = async () => {
    if (selectedSeats.length === 0) return;

    // Importar jsPDF y QR code generator desde CDN
    const script1 = document.createElement('script');
    script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    document.head.appendChild(script2);

    await new Promise(resolve => {
      script1.onload = () => {
        script2.onload = resolve;
      };
    });

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    for (let i = 0; i < selectedSeats.length; i++) {
      const seat = selectedSeats[i];
      const customer = seat.customer || customerInfo;

      if (i > 0) {
        pdf.addPage();
      }

      // Fondo degradado (simulado con rectángulos)
      pdf.setFillColor(124, 58, 237);
      pdf.rect(0, 0, 210, 40, 'F');
      
      // Título
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(28);
      pdf.setFont(undefined, 'bold');
      pdf.text('ENTRADA MATEO BOSS', 105, 20, { align: 'center' });
      
      pdf.setFontSize(20);
      pdf.text(currentShow.name, 105, 32, { align: 'center' });

      // Información del evento
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      
      pdf.text('Fecha:', 20, 55);
      pdf.setFont(undefined, 'normal');
      pdf.text(currentShow.date, 50, 55);
      
      pdf.setFont(undefined, 'bold');
      pdf.text('Hora:', 20, 65);
      pdf.setFont(undefined, 'normal');
      pdf.text(currentShow.time, 50, 65);
      
      // Información del comprador
      pdf.setFont(undefined, 'bold');
      pdf.text('Nombre:', 20, 80);
      pdf.setFont(undefined, 'normal');
      pdf.text(customer.name, 50, 80);
      
      if (customer.phone) {
        pdf.setFont(undefined, 'bold');
        pdf.text('Teléfono:', 20, 90);
        pdf.setFont(undefined, 'normal');
        pdf.text(customer.phone, 50, 90);
      }

      // Recuadro de asiento (destacado)
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(20, 105, 170, 50, 3, 3, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('SECTOR:', 105, 115, { align: 'center' });
      pdf.setFontSize(16);
      pdf.text(seat.sector === 'impar' ? 'IMPAR' : 'PAR', 105, 125, { align: 'center' });
      
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text(`FILA ${seat.row} - ASIENTO ${seat.number}`, 105, 145, { align: 'center' });

      // Generar QR Code
      const qrData = JSON.stringify({
        show: currentShow.id,
        showName: currentShow.name,
        date: currentShow.date,
        time: currentShow.time,
        sector: seat.sector,
        row: seat.row,
        seat: seat.number,
        customer: customer.name,
        id: `${currentShow.id}-${seat.id}`
      });

      // Crear canvas temporal para QR
      const qrCanvas = document.createElement('canvas');
      const QRCode = window.QRCode;
      
      await new Promise((resolve) => {
        const qr = new QRCode(qrCanvas, {
          text: qrData,
          width: 128,
          height: 128,
          colorDark: '#000000',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel.H
        });
        setTimeout(resolve, 100);
      });

      const qrImage = qrCanvas.toDataURL('image/png');
      pdf.addImage(qrImage, 'PNG', 75, 170, 60, 60);

      // Texto inferior
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Conserve esta entrada - Presentar en puerta', 105, 245, { align: 'center' });
      pdf.text('PLATEA BAJA', 105, 252, { align: 'center' });
      
      // Código de verificación
      pdf.setFontSize(8);
      const verificationCode = `${currentShow.id.substring(0, 6)}-${seat.id.substring(0, 8)}`.toUpperCase();
      pdf.text(`Código: ${verificationCode}`, 105, 260, { align: 'center' });

      // Línea de corte
      pdf.setLineDash([2, 2]);
      pdf.setDrawColor(200, 200, 200);
      pdf.line(10, 270, 200, 270);
    }

    // Descargar el PDF
    const fileName = selectedSeats.length > 1 
      ? `Entradas_${currentShow.name.replace(/\s+/g, '_')}.pdf`
      : `Entrada_Fila${selectedSeats[0].row}_Asiento${selectedSeats[0].number}.pdf`;
    
    pdf.save(fileName);
  };

  const getSectorSeats = (sector) => {
    if (!currentShow) return [];
    return currentShow.seats.filter(s => s.sector === sector);
  };

  const renderSector = (sectorName, title) => {
    const sectorSeats = getSectorSeats(sectorName);
    const rows = [...new Set(sectorSeats.map(s => s.row))].sort((a, b) => a - b);

    return (
      <div className="sector">
        <h3 className="sector-title">{title}</h3>
        <div className="rows-container">
          {rows.map(row => {
            let rowSeats = sectorSeats.filter(s => s.row === row);
            
            if (sectorName === 'impar') {
              rowSeats = rowSeats.sort((a, b) => b.number - a.number);
            } else {
              rowSeats = rowSeats.sort((a, b) => a.number - b.number);
            }
            
            return (
              <div key={row} className="seat-row">
                <span className="row-label">Fila {row}</span>
                {rowSeats.map(seat => {
                  const isSelected = selectedSeats.find(s => s.id === seat.id);
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      className={`seat ${seat.status} ${isSelected ? 'selected' : ''}`}
                      title={seat.status === 'sold' ? seat.customer.name : 'Disponible'}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getStats = () => {
    if (!currentShow) return { total: 0, sold: 0, available: 0 };
    const total = currentShow.seats.length;
    const sold = currentShow.seats.filter(s => s.status === 'sold').length;
    return { total, sold, available: total - sold };
  };

  if (!currentShow) {
    return (
      <div className="container">
        <div className="main-card">
          <div className="header">
            <div>
              <h1 className="title">Sistema de Gestión de Entradas</h1>
              <p className="subtitle">Seleccione una función o cree una nueva</p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus size={20} />
              Nueva Función
            </button>
          </div>

          <div className="shows-grid">
            {shows.map(show => {
              const stats = {
                total: show.seats.length,
                sold: show.seats.filter(s => s.status === 'sold').length
              };
              stats.available = stats.total - stats.sold;

              return (
                <div key={show.id} className="show-card" onClick={() => setCurrentShow(show)}>
                  <div className="show-header">
                    <h3>{show.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteShow(show.id);
                      }}
                      className="btn-delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="show-info">
                    <div className="info-row">
                      <Calendar size={16} />
                      <span>{show.date} - {show.time}</span>
                    </div>
                    <div className="info-row">
                      <Users size={16} />
                      <span>Vendidos: {stats.sold} / {stats.total}</span>
                    </div>
                    <div className="progress-container">
                      <div className="progress-info">
                        <span>Disponibles: {stats.available}</span>
                        <span>{Math.round((stats.sold / stats.total) * 100)}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(stats.sold / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {shows.length === 0 && (
            <div className="empty-state">
              <Calendar size={48} />
              <p>No hay funciones creadas. Cree una nueva función para comenzar.</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Nueva Función</h2>
              <div className="form">
                <div className="form-group">
                  <label>Nombre de la función</label>
                  <input
                    type="text"
                    value={newShow.name}
                    onChange={(e) => setNewShow({ ...newShow, name: e.target.value })}
                    placeholder="Ej: Obra de Teatro - Noche de Gala"
                  />
                </div>
                <div className="form-group">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={newShow.date}
                    onChange={(e) => setNewShow({ ...newShow, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Hora</label>
                  <input
                    type="time"
                    value={newShow.time}
                    onChange={(e) => setNewShow({ ...newShow, time: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button onClick={createShow} className="btn-primary">Crear Función</button>
                  <button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="container">
      <div className="main-card">
        <div className="header">
          <button
            onClick={() => setCurrentShow(null)}
            className="btn-back"
          >
            <ChevronLeft size={20} />
            Volver a funciones
          </button>
          <div className="show-title">
            <h2>{currentShow.name}</h2>
            <p>{currentShow.date} - {currentShow.time}</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Asientos</div>
          </div>
          <div className="stat-card sold">
            <div className="stat-value">{stats.sold}</div>
            <div className="stat-label">Vendidos</div>
          </div>
          <div className="stat-card available">
            <div className="stat-value">{stats.available}</div>
            <div className="stat-label">Disponibles</div>
          </div>
        </div>

        <div className="action-bar">
          <button
            onClick={() => {
              setMultiSelectMode(!multiSelectMode);
              setSelectedSeats([]);
            }}
            className={`btn-multi ${multiSelectMode ? 'active' : ''}`}
          >
            <CheckSquare size={18} />
            {multiSelectMode ? 'Cancelar selección' : 'Selección múltiple'}
          </button>
          
          {multiSelectMode && selectedSeats.length > 0 && (
            <div className="selected-info">
              <span>{selectedSeats.length} asiento(s) seleccionado(s)</span>
              <button onClick={openMultiSellModal} className="btn-sell">
                Vender seleccionados
              </button>
            </div>
          )}
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span>Disponible</span>
          </div>
          <div className="legend-item">
            <div className="legend-color sold"></div>
            <span>Vendido</span>
          </div>
          {multiSelectMode && (
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>Seleccionado</span>
            </div>
          )}
        </div>
      </div>

      <div className="theater-map">
        <div className="stage">
          <h3>ESCENARIO</h3>
        </div>

        <div className="sectors">
          {renderSector('impar', 'Sector Impar')}
          <div className="pasillo-central">
            <span className="pasillo-label">PASILLO</span>
          </div>
          {renderSector('par', 'Sector Par')}
        </div>

        <div className="platea">
          <p>PLATEA BAJA</p>
        </div>
      </div>

      {seatModal && selectedSeats.length > 0 && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{selectedSeats[0].status === 'sold' ? 'Editar' : 'Vender'} {selectedSeats.length > 1 ? 'Asientos' : 'Asiento'}</h2>
            <div className="seats-list">
              {selectedSeats.map(seat => (
                <p key={seat.id} className="seat-info">
                  Sector {seat.sector === 'impar' ? 'Impar' : 'Par'} - Fila {seat.row} - Asiento {seat.number}
                </p>
              ))}
            </div>
            <div className="form">
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>
              <div className="form-group">
                <label>Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="341-1234567"
                />
              </div>
              <div className="form-group">
                <label>Email (opcional)</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="modal-actions">
                <button onClick={saveSeatInfo} className="btn-save">
                  <Save size={18} />
                  Guardar
                </button>
                {selectedSeats[0].status === 'sold' && selectedSeats.length === 1 && (
                  <>
                    <button onClick={generatePDFTickets} className="btn-print">
                      <Download size={18} />
                      Descargar PDF
                    </button>
                    <button onClick={freeSeat} className="btn-free">Liberar</button>
                  </>
                )}
                {selectedSeats[0].status === 'sold' && selectedSeats.length > 1 && (
                  <button onClick={generatePDFTickets} className="btn-print">
                    <Download size={18} />
                    Descargar PDF
                  </button>
                )}
                <button onClick={() => { setSeatModal(false); setSelectedSeats([]); setMultiSelectMode(false); }} className="btn-secondary">
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeatroSeatManager;