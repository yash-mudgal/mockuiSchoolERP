/* ==========================================================================
   pages/auth.js — login (role picker), forgot password, lock screen
   These render OUTSIDE the app shell, straight into #app.
   ========================================================================== */

import { h, frag, Icon, Button, Input, Field, Checkbox, Avatar, notify, Badge } from '../core/ui.js';
import { icon } from '../core/icons.js';
import { ROLES, login, userForRole, unlock, get, set } from '../core/state.js';

/* ------------------------------------------------------------------ brand */

function brandMark(size = 30) {
  return h('div', { className: 'sb-logo', style: { width: size + 'px', height: size + 'px' }, html: icon('graduation-cap', Math.round(size * 0.6)) });
}

function aside() {
  return h('div', { className: 'auth-aside' },
    h('div', { className: 'auth-brand' },
      brandMark(36),
      h('div', null,
        h('div', { style: { fontWeight: 600, fontSize: '15px' } }, 'Springdale International'),
        h('div', { style: { fontSize: '11px', opacity: 0.7, letterSpacing: '0.09em', textTransform: 'uppercase' } }, 'School Group ERP'))),
    h('div', { className: 'stack-4' },
      h('div', { className: 'auth-headline' }, 'One platform for every campus.'),
      h('div', { className: 'auth-sub' },
        'Admissions, academics, fees, transport, hostel, HR and analytics — unified across five campuses and 2,400 students.'),
      h('div', { className: 'row-3 row-wrap mt-4' },
        ['CBSE', 'ICSE', 'IB'].map((b) => h('span', {
          style: {
            padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
            background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
          },
        }, b)))),
    h('div', { className: 'auth-stats' },
      [['5', 'Campuses'], ['2,400', 'Students'], ['380', 'Staff'], ['29', 'Modules']].map(([v, l]) =>
        h('div', null,
          h('div', { className: 'auth-stat-v' }, v),
          h('div', { className: 'auth-stat-l' }, l)))));
}

/* ------------------------------------------------------------------ login */

/**
 * renderLogin(mount, { onSuccess })
 * A role picker plus a (decorative) credential form — any password works.
 */
export function renderLogin(mount, { onSuccess } = {}) {
  let role = get('role') || 'super-admin';
  let showPassword = false;

  const rolesHost = h('div', { className: 'auth-roles' });
  const identityHost = h('div', { className: 'callout', dataset: { tone: 'brand' } });

  const paintIdentity = () => {
    const u = userForRole(role);
    identityHost.innerHTML = '';
    identityHost.appendChild(Avatar(u.name, { size: 'md' }));
    identityHost.appendChild(h('div', { className: 'flex-1' },
      h('div', { className: 't-semibold' }, u.name),
      h('div', { className: 't-sm', style: { opacity: 0.85 } }, u.designation)));
  };

  const paintRoles = () => {
    rolesHost.innerHTML = '';
    for (const r of ROLES) {
      rolesHost.appendChild(h('button', {
        className: ['auth-role', r.id === role && 'is-active'].filter(Boolean).join(' '),
        type: 'button',
        onClick: () => { role = r.id; paintRoles(); paintIdentity(); },
      }, Icon(r.icon, 15), h('span', { className: 'auth-role-name' }, r.name)));
    }
  };
  paintRoles();
  paintIdentity();

  const passwordInput = Input({ type: 'password', value: 'springdale', placeholder: '••••••••' });
  const toggleEye = h('button', {
    type: 'button', className: 'icon-btn', dataset: { size: 'sm' },
    attrs: { 'aria-label': 'Toggle password visibility' },
    onClick: () => {
      showPassword = !showPassword;
      passwordInput.type = showPassword ? 'text' : 'password';
      toggleEye.innerHTML = icon(showPassword ? 'eye-off' : 'eye', 14);
    },
    html: icon('eye', 14),
  });

  const doLogin = () => {
    login(role);
    notify({ title: `Signed in as ${userForRole(role).name}`, text: ROLES.find((r) => r.id === role).name, tone: 'success' });
    if (onSuccess) onSuccess(role);
  };

  const form = h('form', {
    className: 'stack-4',
    onSubmit: (e) => { e.preventDefault(); doLogin(); },
  },
    Field({ label: 'Work email', required: true },
      Input({ type: 'email', value: 'demo@springdale.edu.in', placeholder: 'you@springdale.edu.in' })),
    Field({ label: 'Password', required: true, hint: 'Prototype build — any password is accepted.' },
      h('div', { className: 'row', style: { position: 'relative' } },
        passwordInput,
        h('span', { style: { position: 'absolute', right: '4px' } }, toggleEye))),
    h('div', { className: 'row' },
      Checkbox('Keep me signed in', { checked: true }),
      h('span', { className: 'spacer' }),
      h('a', {
        href: '#', className: 't-sm',
        onClick: (e) => { e.preventDefault(); renderForgot(mount, { onBack: () => renderLogin(mount, { onSuccess }) }); },
      }, 'Forgot password?')),
    Button('Sign in', { variant: 'primary', size: 'lg', block: true, type: 'submit', iconRight: 'arrow-right' }));

  mount.innerHTML = '';
  mount.appendChild(h('div', { className: 'auth-page' },
    aside(),
    h('div', { className: 'auth-main' },
      h('div', { className: 'auth-card' },
        h('div', { className: 'stack-2' },
          h('div', { className: 'row', style: { gap: '10px' } }, brandMark(28),
            h('span', { className: 't-semibold' }, 'Springdale ERP'),
            Badge('Demo', { tone: 'brand' })),
          h('div', { className: 'auth-title' }, 'Sign in'),
          h('div', { className: 't-muted' }, 'Choose a role to explore the product from that persona.')),
        h('div', { className: 'stack-2' },
          h('div', { className: 't-eyebrow' }, 'Sign in as'),
          rolesHost,
          identityHost),
        form,
        h('div', { className: 'auth-foot' },
          'Protected by role-based access control · ',
          h('a', { href: '#', onClick: (e) => e.preventDefault() }, 'Privacy'), ' · ',
          h('a', { href: '#', onClick: (e) => e.preventDefault() }, 'Terms'))))));
}

/* -------------------------------------------------------- forgot password */

/** renderForgot(mount, {onBack}) — a two-step reset flow (email → sent). */
export function renderForgot(mount, { onBack } = {}) {
  const host = h('div', { className: 'auth-card' });

  const step2 = () => {
    host.innerHTML = '';
    host.appendChild(h('div', { className: 'stack-4', style: { textAlign: 'center' } },
      h('div', { className: 'modal-icon', dataset: { tone: 'success' }, style: { margin: '0 auto', width: '52px', height: '52px' }, html: icon('mail', 24) }),
      h('div', { className: 'auth-title' }, 'Check your inbox'),
      h('div', { className: 't-muted' },
        'If an account exists for that address we have sent a password reset link. It expires in 30 minutes.'),
      Button('Back to sign in', { variant: 'primary', block: true, onClick: onBack }),
      h('div', { className: 't-sm t-muted' }, 'Didn’t get it? ',
        h('a', { href: '#', onClick: (e) => { e.preventDefault(); notify({ title: 'Reset link re-sent', tone: 'info' }); } }, 'Resend'))));
  };

  const step1 = () => {
    host.innerHTML = '';
    host.appendChild(h('form', {
      className: 'stack-4',
      onSubmit: (e) => { e.preventDefault(); step2(); },
    },
      h('div', { className: 'stack-2' },
        h('div', { className: 'row', style: { gap: '10px' } }, brandMark(28), h('span', { className: 't-semibold' }, 'Springdale ERP')),
        h('div', { className: 'auth-title' }, 'Reset password'),
        h('div', { className: 't-muted' }, 'Enter the email registered with your account and we will send a reset link.')),
      Field({ label: 'Work email', required: true }, Input({ type: 'email', placeholder: 'you@springdale.edu.in' })),
      Button('Send reset link', { variant: 'primary', size: 'lg', block: true, type: 'submit' }),
      Button('Back to sign in', { variant: 'ghost', block: true, icon: 'arrow-left', onClick: onBack })));
  };
  step1();

  mount.innerHTML = '';
  mount.appendChild(h('div', { className: 'auth-page' }, aside(), h('div', { className: 'auth-main' }, host)));
}

/* ------------------------------------------------------------ lock screen */

/**
 * renderLock(mount, {onUnlock}) — shown when the session is locked.
 * Any password unlocks; "Sign out" returns to the login screen.
 */
export function renderLock(mount, { onUnlock, onSignOut } = {}) {
  const user = get('currentUser') || userForRole(get('role'));
  const input = Input({ type: 'password', placeholder: 'Enter your password' });

  mount.innerHTML = '';
  mount.appendChild(h('div', { className: 'lock-page' },
    h('form', {
      className: 'lock-card',
      onSubmit: (e) => {
        e.preventDefault();
        unlock();
        notify({ title: 'Welcome back', tone: 'success' });
        if (onUnlock) onUnlock();
      },
    },
      Avatar(user.name, { size: '2xl', ring: true }),
      h('div', null,
        h('h2', null, user.name),
        h('div', { className: 't-sm t-muted mt-1' }, user.designation)),
      h('div', { className: 'row', style: { gap: '6px', color: 'var(--text-muted)' } },
        Icon('lock', 14), h('span', { className: 't-sm' }, 'Session locked')),
      h('div', { className: 'w-full' }, input),
      Button('Unlock', { variant: 'primary', block: true, type: 'submit', icon: 'unlock' }),
      h('button', {
        type: 'button', className: 'btn btn-link t-sm',
        onClick: () => { set({ locked: false }); if (onSignOut) onSignOut(); },
      }, 'Sign in as a different user'))));
}

export default { renderLogin, renderForgot, renderLock };
