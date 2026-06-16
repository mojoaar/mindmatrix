export const DEFAULT_VERIFY_TEMPLATE = `# Verify your email

Hi {{name}},

Click the link below to verify your MindMatrix account:

[{{url}}]({{url}})

This link expires in 24 hours.

— MindMatrix`;

export const DEFAULT_RESET_TEMPLATE = `# Reset your password

Hi {{name}},

Click the link below to reset your MindMatrix password:

[{{url}}]({{url}})

This link expires in 1 hour. If you didn't request this, ignore this email.

— MindMatrix`;
