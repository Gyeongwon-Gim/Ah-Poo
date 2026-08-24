import styled from '@emotion/styled';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  isOpen,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <StyledOverlay onClick={onCancel}>
      <StyledDialog onClick={(e) => e.stopPropagation()}>
        <StyledText>{message}</StyledText>
        <StyledButtons>
          <StyledButton type="button" onClick={onCancel}>
            {cancelLabel}
          </StyledButton>
          <StyledButton type="button" $danger={danger} onClick={onConfirm}>
            {confirmLabel}
          </StyledButton>
        </StyledButtons>
      </StyledDialog>
    </StyledOverlay>
  );
};

export default ConfirmDialog;

const StyledOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ap-overlay);
  z-index: 1000;
`;

const StyledDialog = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-6);
  width: 280px;
  padding: var(--ap-space-6);
  background: var(--ap-surface);
  border-radius: var(--ap-radius);
  box-shadow: var(--ap-shadow-sheet);
`;

const StyledText = styled.p`
  margin: 0;
  font-size: var(--ap-font-body);
  color: var(--ap-text);
  text-align: center;
`;

const StyledButtons = styled.div`
  display: flex;
  gap: var(--ap-space-3);
`;

const StyledButton = styled.button<{ $danger?: boolean }>`
  flex: 1;
  padding: var(--ap-space-4);
  background: ${({ $danger }) =>
    $danger ? 'var(--ap-error)' : 'var(--ap-neutral-100)'};
  border: none;
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-medium);
  color: ${({ $danger }) => ($danger ? 'white' : 'var(--ap-text)')};
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover {
    background: ${({ $danger }) =>
      $danger ? 'var(--ap-error-dark)' : 'var(--ap-neutral-200)'};
  }
`;
