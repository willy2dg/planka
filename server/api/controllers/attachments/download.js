// const fs = require('fs');
// const path = require('path');
const axios = require('axios');

const Errors = {
  ATTACHMENT_NOT_FOUND: {
    attachmentNotFound: 'Attachment not found',
  },
};

module.exports = {
  inputs: {
    id: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
  },

  exits: {
    attachmentNotFound: {
      responseType: 'notFound',
    },
  },

  async fn(inputs, exits) {
    const { currentUser } = this.req;
    // console.log('Llegue al paso 1');
    const { attachment, card, project } = await sails.helpers.attachments
      .getProjectPath(inputs.id)
      .intercept('pathNotFound', () => Errors.ATTACHMENT_NOT_FOUND);
    // console.log('Llegue al paso 2');
    const isBoardMember = await sails.helpers.users.isBoardMember(currentUser.id, card.boardId);
    // console.log('Llegue al paso 3');
    if (!isBoardMember) {
      const isProjectManager = await sails.helpers.users.isProjectManager(
        currentUser.id,
        project.id,
      );

      if (!isProjectManager) {
        throw Errors.ATTACHMENT_NOT_FOUND; // Forbidden
      }
    }
    // console.log('Llegue al paso 4');
    // const filePath = path.join(
    //   //sails.config.custom.attachmentsPath,
    //   attachment.dirname,
    //   attachment.filename,
    // );

    // console.log('El atachment', attachment);
    const filePath = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${attachment.name}`;

    // console.log('Filepath:', filePath);

    // this.res.type(attachment.filename);
    // if (!attachment.image && path.extname(attachment.filename) !== '.pdf') {
    //   this.res.set('Content-Disposition', 'attachment');
    // }
    // this.res.set('Cache-Control', 'private, max-age=900'); // TODO: move to config
    // this.res.writeHead(200, {"Content-Type": "image/png"});

    const response = await axios.get(filePath, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'utf-8');

    // const archivo = await leerImagen(filePath)

    return exits.success(buffer);
  },
};
