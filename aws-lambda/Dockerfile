FROM public.ecr.aws/lambda/nodejs:18

# Copy dependencies
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install dependencies
RUN npm ci --omit=dev

# Copy function code
COPY src/handlers/*.mjs ${LAMBDA_TASK_ROOT}/
COPY src/handlers/*.js ${LAMBDA_TASK_ROOT}/
COPY src/lib/ ${LAMBDA_TASK_ROOT}/src/lib/

# Set handler
CMD [ "agent-coach.handler" ]
