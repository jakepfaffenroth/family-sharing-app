import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';

export default new Notyf({
  position: { x: 'right', y: 'bottom' },
  duration: 2000,
  types: [
    {
      type: 'info',
      background: '#2563eb'
    }
  ]
});
