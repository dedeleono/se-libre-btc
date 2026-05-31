import { render } from '@react-email/render';
import WelcomeEmail from '@/components/emails/welcome';
import ReminderEmail from '@/components/emails/reminder';
import FollowUpEmail from '@/components/emails/follow-up';

export type TemplateType = 'welcome' | 'reminder' | 'followup';

export const getEmailTemplate = async (template: TemplateType, data: any = {}) => {
  let emailComponent;
  let subject = '';

  switch (template) {
    case 'welcome':
      emailComponent = WelcomeEmail({ userFirstname: data.firstName || 'Estudiante' });
      subject = '¡Bienvenido a Se Libre!';
      break;
    case 'reminder':
      emailComponent = ReminderEmail({ username: data.firstName || 'Estudiante' });
      subject = 'Recordatorio de actividades pendientes';
      break;
    case 'followup':
      emailComponent = FollowUpEmail({ tips: [] });
      subject = 'Seguimiento de tu progreso';
      break;
  }

  const html = await render(emailComponent);
  return { html, subject };
};
