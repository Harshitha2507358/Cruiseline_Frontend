import { Modal, Button } from 'react-bootstrap'

// Reusable confirmation for destructive/important actions.
export default function ConfirmDialog({
  show, title = 'Are you sure?', body, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', variant = 'danger', busy = false, onConfirm, onCancel,
}) {
  return (
    <Modal show={show} onHide={busy ? undefined : onCancel} centered>
      <Modal.Header closeButton={!busy}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onCancel} disabled={busy}>{cancelLabel}</Button>
        <Button variant={variant} onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
