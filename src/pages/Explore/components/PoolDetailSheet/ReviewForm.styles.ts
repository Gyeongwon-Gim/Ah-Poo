import styled from '@emotion/styled';

export const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-6);
  padding: var(--ap-space-5);
  background: var(--ap-neutral-50);
  border-radius: var(--ap-radius-md);
`;

export const StyledSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ap-space-3);
`;

export const StyledLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const StyledLabel = styled.label`
  font-size: var(--ap-font-body-sm);
  font-weight: var(--ap-font-weight-medium);
  color: var(--ap-text);
`;

export const StyledCharCount = styled.span<{ $warning: boolean }>`
  font-size: var(--ap-font-caption);
  color: ${({ $warning }) =>
    $warning ? 'var(--ap-error)' : 'var(--ap-text-muted)'};
`;

export const StyledTextarea = styled.textarea`
  width: 100%;
  padding: var(--ap-space-4);
  background: var(--ap-surface);
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  line-height: 1.5;
  color: var(--ap-text);
  resize: vertical;
  min-height: 100px;

  &::placeholder {
    color: var(--ap-text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--ap-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const StyledError = styled.p`
  margin: 0;
  padding: var(--ap-space-3);
  background: var(--ap-error-bg);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body-sm);
  color: var(--ap-error);
`;

export const StyledButtonRow = styled.div`
  display: flex;
  gap: var(--ap-space-3);
`;

export const StyledSubmitButton = styled.button`
  flex: 1;
  padding: var(--ap-space-4);
  background: var(--ap-primary);
  border: none;
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  font-weight: var(--ap-font-weight-medium);
  color: white;
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover:not(:disabled) {
    background: var(--ap-primary-dark);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const StyledCancelButton = styled.button`
  padding: var(--ap-space-4) var(--ap-space-6);
  background: var(--ap-surface);
  border: 1px solid var(--ap-border-neutral);
  border-radius: var(--ap-radius-sm);
  font-size: var(--ap-font-body);
  color: var(--ap-text-muted);
  cursor: pointer;
  transition: background-color var(--ap-duration-fast) var(--ap-ease-out);

  &:hover:not(:disabled) {
    background: var(--ap-neutral-100);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
