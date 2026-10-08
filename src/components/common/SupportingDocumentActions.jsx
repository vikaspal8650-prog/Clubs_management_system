import React from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { Button } from './Button';
import './SupportingDocumentActions.css';

const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const getEventSupportingDocument = (event) =>
  event?.supportingDocument || event?.documents?.find((document) => document.category === 'Event Proposal') || null;

export const getSupportingDocumentUrl = (document) => {
  const fileReference = typeof document === 'string'
    ? document
    : document?.dataUrl || document?.fileUrl || document?.url || null;

  if (!fileReference) return null;
  return fileReference.startsWith('/') ? `${apiOrigin}${fileReference}` : fileReference;
};

export const SupportingDocumentActions = ({ event }) => {
  const document = getEventSupportingDocument(event);
  const documentUrl = getSupportingDocumentUrl(document);
  const fileName = typeof document === 'string'
    ? document.split('/').pop()
    : document?.name || document?.title || 'Supporting document';

  if (!document || !documentUrl) return null;

  const downloadDocument = () => {
    const link = window.document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    link.rel = 'noopener';
    window.document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <section className="supporting-document" aria-label="Supporting document">
      <div className="supporting-document__file">
        <FileText size={20} aria-hidden="true" />
        <div>
          <span className="supporting-document__label">Supporting Document</span>
          <span className="supporting-document__name">{fileName}</span>
        </div>
      </div>
      <div className="supporting-document__actions">
        <Button variant="ghost" size="sm" icon={Eye} onClick={() => window.open(documentUrl, '_blank', 'noopener,noreferrer')}>
          View Document
        </Button>
        <Button variant="outline" size="sm" icon={Download} onClick={downloadDocument}>
          Download
        </Button>
      </div>
    </section>
  );
};
