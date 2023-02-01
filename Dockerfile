FROM node@sha256:9cfd511a5bca3cac43201e5b185c44da4f066019d20a6af85a03196400b401b4

RUN mkdir -p /opt/app
WORKDIR /opt/app
RUN adduser -S app
COPY . .

RUN npm ci
RUN npx tsc
RUN chown -R app /opt/app/build

USER app

ENTRYPOINT ["npm", "start", "--"]
