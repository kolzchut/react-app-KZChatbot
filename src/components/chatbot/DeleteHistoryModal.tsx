import { useTranslation } from '@/hooks/useTranslation';
import './deleteHistoryModal.css';

interface DeleteHistoryModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

const DeleteHistoryModal = ({ isOpen, onCancel, onConfirm, isLoading }: DeleteHistoryModalProps) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="delete-history-modal-overlay">
      <div className="delete-history-modal-dialog" role="dialog" aria-modal="true">
        <h2 className="delete-history-modal-title">{t('delete_history_modal_title')}</h2>
        <p className="delete-history-modal-body">{t('delete_history_modal_body')}</p>
        <div className="delete-history-modal-actions">
          <button className="delete-history-modal-confirm" onClick={onConfirm} disabled={isLoading}>{t('delete_history_confirm')}</button>
          <button className="delete-history-modal-cancel" onClick={onCancel}>{t('delete_history_cancel')}</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteHistoryModal;