import React from 'react';
import { passwordChecks } from '../../utils/validators';

// Live list of password rules; a rule turns green once met
const PasswordChecklist = ({ value }) => (
  <ul className="-mt-2 mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
    {passwordChecks(value).map((check) => (
      <li key={check.label} className={check.ok ? 'text-success' : 'text-ink/50'}>
        {check.ok ? '✓' : '○'} {check.label}
      </li>
    ))}
  </ul>
);

export default React.memo(PasswordChecklist);
