import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './DataTable.css';

interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  renderRow: (item: any, index: number) => React.ReactNode;
  title?: string;
  subtitle?: string;
  totalCount?: number;
  actions?: React.ReactNode;
  pageSize?: number;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  renderRow,
  title,
  subtitle,
  totalCount,
  actions,
  pageSize = 5,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const total = totalCount ?? data.length;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  
  // Tri automatique pour afficher les plus récents en premier
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.createdAt || a.date || a.signedAt || a.updatedAt;
    const dateB = b.createdAt || b.date || b.signedAt || b.updatedAt;
    
    if (dateA && dateB) {
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }
    return 0;
  });

  const startIdx = (currentPage - 1) * pageSize;
  const visibleData = sortedData.slice(startIdx, startIdx + pageSize);
  const showingStart = data.length > 0 ? startIdx + 1 : 0;
  const showingEnd = Math.min(startIdx + pageSize, data.length);

  return (
    <div className="datatable animate-fade-in">
      {/* Header */}
      {(title || actions) && (
        <div className="datatable-header">
          <div className="datatable-header-left">
            {title && <h3 className="datatable-title">{title}</h3>}
            {subtitle && <p className="datatable-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="datatable-actions">{actions}</div>}
        </div>
      )}

      {/* Table */}
      <div className="datatable-table-wrapper">
        <table className="datatable-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.length > 0 ? (
              visibleData.map((item, idx) => renderRow(item, startIdx + idx))
            ) : (
              <tr>
                <td colSpan={columns.length} className="datatable-empty">
                  Aucune donnée disponible.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="datatable-footer">
        <span className="datatable-footer-info">
          Affichage de <strong>{showingStart}-{showingEnd}</strong> sur{' '}
          <strong>{total}</strong> entrées
        </span>

        <div className="datatable-pagination">
          <button
            className="datatable-page-btn"
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="datatable-page-indicator">
            {currentPage} / {totalPages}
          </span>
          <button
            className="datatable-page-btn"
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
