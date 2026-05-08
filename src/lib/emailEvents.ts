export type ProgramReadyEmailData = {
  firstName?: string;
  programName?: string;
  accessUrl?: string;
};

export type EmailResult<TData> = {
  success: boolean;
  email: string;
  data: TData;
};

export async function sendProgramReadyEmail(
  email: string,
  data: ProgramReadyEmailData = {},
): Promise<EmailResult<ProgramReadyEmailData>> {
  console.info('sendProgramReadyEmail placeholder', { email, data });

  return {
    success: true,
    email,
    data,
  };
}

export async function sendWelcomeEmail(email: string): Promise<EmailResult<Record<string, never>>> {
  console.info('sendWelcomeEmail placeholder', { email });
  return {
    success: true,
    email,
    data: {},
  };
}