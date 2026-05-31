import { createTransport, Transporter } from 'nodemailer';
import { render } from '@react-email/render';
import AuthEmail from '@/components/emails/auth-email';

interface EmailConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
}

interface EmailError extends Error {
    code?: string;
    command?: string;
    responseCode?: number;
    response?: string;
    responseData?: string;
    smtp?: any;
    smtpResponse?: string;
}

function validateEmailConfig(): EmailConfig {
    const requiredEnvVars = {
        EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
        EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT || '465',
        EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
        EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
        EMAIL_FROM: process.env.EMAIL_FROM,
    };

    const missingVars = Object.entries(requiredEnvVars)
        .filter(([key, value]) => key !== 'EMAIL_SERVER_PORT' && !value)
        .map(([key]) => key);

    if (missingVars.length > 0) {
        console.error('Missing email configuration:', {
            missingVariables: missingVars,
            currentConfig: {
                hasEmailUser: !!requiredEnvVars.EMAIL_SERVER_USER,
                hasEmailPassword: !!requiredEnvVars.EMAIL_SERVER_PASSWORD,
                emailHost: requiredEnvVars.EMAIL_SERVER_HOST,
                emailPort: 465,
                emailFrom: requiredEnvVars.EMAIL_FROM,
            }
        });
        throw new Error(`Missing required email configuration: ${missingVars.join(', ')}`);
    }

    return {
        host: requiredEnvVars.EMAIL_SERVER_HOST!,
        port: 465,
        user: requiredEnvVars.EMAIL_SERVER_USER!,
        password: requiredEnvVars.EMAIL_SERVER_PASSWORD!,
        from: requiredEnvVars.EMAIL_FROM!,
    };
}

function createEmailTransport(config: EmailConfig): Transporter {
    

    const transport = createTransport({
        host: config.host,
        port: config.port,
        secure: true,
        auth: {
            user: config.user,
            pass: config.password,
        },
        tls: {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2',
        },
        debug: true, // Always enable debug in development
        logger: true, // Always enable logger in development
    });

    // Verify the transport configuration
    transport.verify((error, success) => {
        if (error) {
            console.error('SMTP Connection Error:', error);
        } else {
            console.log('SMTP Connection Verified:', success);
        }
    });

    return transport;
}

export async function sendAuthEmail(email: string, url: string) {

    try {
        const parsedUrl = new URL(url);
        
    } catch (error) {
        console.error('Invalid URL format:', error);
        throw new Error('Invalid verification URL format');
    }

    const { host } = new URL(url);

    const emailConfig = validateEmailConfig();

    const transport = createEmailTransport(emailConfig);
    
    try {
        console.log('Attempting to send email...');
        const html = await render(AuthEmail({ host, url }));
        const result = await transport.sendMail({
            from: `Se Libre <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: "Sign in to Se Libre",
            html,
        });
        console.log('Email sent successfully:', {
            messageId: result.messageId,
            accepted: result.accepted,
            rejected: result.rejected,
        });
        return result;
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    } finally {
        transport.close();
    }
}