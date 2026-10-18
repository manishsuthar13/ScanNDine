import React from 'react';
import { api } from '../services/api';
import { useTeamMembers } from '../hooks/useTeamMembers';
import { Card, Button, TextField, Alert, Badge, Pagination, Spinner } from './ui';
import { TEXT } from '../constants/text';

const T = TEXT.team;

const MemberRow = React.memo(({ member, isSelf, onRemove }) => (
  <li className="flex items-center justify-between gap-3 border-b border-ink/10 py-3 last:border-0">
    <span className="min-w-0">
      <span className="font-semibold">{member.username}</span>
      <span className="block truncate text-sm text-ink/60">{member.email}</span>
    </span>
    {isSelf ? <Badge tone="accent">{TEXT.common.you}</Badge> : (
      <Button variant="soft" size="sm" onClick={() => onRemove(member)}>{TEXT.common.remove}</Button>
    )}
  </li>
));

// Staff or admins of the admin's own restaurant: list, add, remove
const MemberSection = ({ title, noun, currentUserId, source }) => {
  const { members, form, submit, adding, error, removeMember } = useTeamMembers(source);

  return (
    <Card title={`${title} (${members.pagination.total})`} className="mb-6">
      {members.loading && members.items.length === 0 ? <Spinner /> : (
        <ul>
          {members.items.length === 0 && <li className="py-2 text-ink/60">{T.empty(noun)}</li>}
          {members.items.map((m) => (
            <MemberRow key={m._id} member={m} isSelf={m._id === currentUserId} onRemove={removeMember} />
          ))}
        </ul>
      )}
      <Pagination pagination={members.pagination} onPage={members.setPage} disabled={members.loading} />

      <form onSubmit={submit} noValidate className="mt-6 border-t border-ink/10 pt-5">
        <h4 className="mb-3 font-bold">{T.add(noun)}</h4>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-3">
          <TextField label={T.usernamePlaceholder} autoCapitalize="none" {...form.bind('username')} />
          <TextField label={T.emailPlaceholder} type="email" {...form.bind('email')} />
          <TextField label={T.passwordPlaceholder} type="password" autoComplete="new-password" {...form.bind('password')} />
        </div>
        <Alert>{error || members.error}</Alert>
        <Button type="submit" loading={adding}>{T.add(noun)}</Button>
      </form>
    </Card>
  );
};

const STAFF = { list: api.getStaff, add: api.addStaff, remove: api.removeStaff };
const ADMINS = { list: api.getAdmins, add: api.addAdmin, remove: api.removeAdmin };

const AdminTeam = ({ currentUserId }) => (
  <>
    <MemberSection title={T.staffTitle} noun={T.staffNoun} currentUserId={currentUserId} source={STAFF} />
    <MemberSection title={T.adminsTitle} noun={T.adminNoun} currentUserId={currentUserId} source={ADMINS} />
  </>
);

export default AdminTeam;
