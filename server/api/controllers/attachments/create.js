const util = require('util');
const skipper = require('skipper-s3');
// const { v4: uuid } = require('uuid');

const Errors = {
  NOT_ENOUGH_RIGHTS: {
    notEnoughRights: 'Not enough rights',
  },
  CARD_NOT_FOUND: {
    cardNotFound: 'Card not found',
  },
  NO_FILE_WAS_UPLOADED: {
    noFileWasUploaded: 'No file was uploaded',
  },
};

module.exports = {
  inputs: {
    cardId: {
      type: 'string',
      regex: /^[0-9]+$/,
      required: true,
    },
    requestId: {
      type: 'string',
      isNotEmptyString: true,
    },
  },

  exits: {
    notEnoughRights: {
      responseType: 'forbidden',
    },
    cardNotFound: {
      responseType: 'notFound',
    },
    noFileWasUploaded: {
      responseType: 'unprocessableEntity',
    },
    uploadError: {
      responseType: 'unprocessableEntity',
    },
  },

  async fn(inputs, exits) {
    const { currentUser } = this.req;

    const { card } = await sails.helpers.cards
      .getProjectPath(inputs.cardId)
      .intercept('pathNotFound', () => Errors.CARD_NOT_FOUND);

    const boardMembership = await BoardMembership.findOne({
      boardId: card.boardId,
      userId: currentUser.id,
    });

    if (!boardMembership) {
      throw Errors.CARD_NOT_FOUND; // Forbidden
    }

    if (boardMembership.role !== BoardMembership.Roles.EDITOR) {
      throw Errors.NOT_ENOUGH_RIGHTS;
    }

    const upload = util.promisify((options, callback) =>
      this.req.file('file').upload(options, (error, files) => callback(error, files)),
    );

    let files;
    try {
      // console.log('Intentando suubir!');
      files = await upload({
        adapter: skipper,
        key: process.env.AWS_S3_ACCESS_KEY_ID,
        secret: process.env.AWS_S3_SECRET_ACCESS_KEY,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_S3_REGION,
        maxBytes: null,
        // saveAs: uuid(),
        // maxBytes: null,
      });
    } catch (error) {
      // console.log('mi error....', error);
      return exits.uploadError(error.message); // TODO: add error
    }

    // console.log('Pase el error...');

    if (files.length === 0) {
      throw Errors.NO_FILE_WAS_UPLOADED;
    }
    // console.log('Pase el error... 2 ');
    const file = _.last(files);

    // console.log('Pase el error... 2.5 ', file);
    // const fileData = await sails.helpers.attachments.processUploadedFile(file);
    const fileData = { ...file, dirname: file.filename, name: file.fd };
    // console.log('fileData', fileData);

    // console.log("Pase el error...3",{
    //   values: {
    //     ...fileData,
    //     card,
    //     creatorUser: currentUser,
    //   },
    //   requestId: inputs.requestId,
    //   request: this.req,
    // })

    const attachment = await sails.helpers.attachments.createOne.with({
      values: {
        ...fileData,
        card,
        creatorUser: currentUser,
      },
      requestId: inputs.requestId,
      request: this.req,
    });

    // console.log('Pase el error... 4');

    return exits.success({
      item: attachment,
    });
  },
};
