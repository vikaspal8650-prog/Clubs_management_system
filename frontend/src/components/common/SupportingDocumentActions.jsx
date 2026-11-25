import React from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { Button } from './Button';
import { API_ORIGIN } from '../../services/api';
import './SupportingDocumentActions.css';

export const getEventSupportingDocument = (event) =>
  event?.supportingDocument || event?.documents?.find((document) => document.category === 'Event Proposal') || null;

export const getSupportingDocumentUrl = (document) => {
  const fileReference = typeof document === 'string'
    ? document
    : document?.dataUrl || document?.fileUrl || document?.url || null;

  if (!fileReference) return null;
  return fileReference.startsWith('/') ? `${API_ORIGIN}${fileReference}` : fileReference;
};

export const SupportingDocumentActions = ({ event }) => {
  const document = getEventSupportingDocument(event);
  const documentUrl = getSupportingDocumentUrl(document);
  const fileName = typeof document === 'string'
    ? document.split('/').pop()
    : document?.name || document?.title || 'Supporting document';

  if (!document || !documentUrl) return null;

  const openDocument = async () => {
    try {
      const filePath = typeof document === 'string' ? document : document?.fileUrl || document?.url;
      const response = await fetch(documentUrl, { credentials: 'include' });
      if (!response.ok) throw new Error('Document is unavailable or access was denied.');
      const blobUrl = URL.createObjectURL(await response.blob());
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      window.alert(error.message || 'Unable to open this document.');
    }
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
        <Button variant="ghost" size="sm" icon={Eye} onClick={openDocument}>
          View Document
        </Button>
        <Button variant="outline" size="sm" icon={Download} onClick={openDocument}>
          Download
        </Button>
      </div>
    </section>
  );
};
