import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { Gallery, Item as GalleryItem } from 'react-photoswipe-gallery';
import { Button, Modal } from 'semantic-ui-react';
import { useToggle } from '../../../lib/hooks';

import Item from './Item';

import styles from './Attachments.module.scss';

const INITIALLY_VISIBLE = 4;

const style = {
  position: 'fixed',
  left: '0',
  width: '900px !important',
  height: 'auto',
  overflow: 'auto',
  bgcolor: 'transparent',
  border: '2px solid #000',
  maxWidth: '80vw !important',
  maxHeight: '20vh !important',
};

const Attachments = React.memo(
  ({ items, canEdit, onUpdate, onDelete, onCoverUpdate, onGalleryOpen, onGalleryClose }) => {
    const [t] = useTranslation();
    const [isAllVisible, toggleAllVisible] = useToggle();
    const [imagenOpen, setImagenOpen] = useState();

    const handleCoverSelect = useCallback(
      (id) => {
        onCoverUpdate(id);
      },
      [onCoverUpdate],
    );

    const handleCoverDeselect = useCallback(() => {
      onCoverUpdate(null);
    }, [onCoverUpdate]);

    const handleUpdate = useCallback(
      (id, data) => {
        onUpdate(id, data);
      },
      [onUpdate],
    );

    const handleDelete = useCallback(
      (id) => {
        onDelete(id);
      },
      [onDelete],
    );

    const handleBeforeGalleryOpen = useCallback(
      (gallery) => {
        onGalleryOpen();

        gallery.on('destroy', () => {
          onGalleryClose();
        });
      },
      [onGalleryOpen, onGalleryClose],
    );

    const handleToggleAllVisibleClick = useCallback(() => {
      toggleAllVisible();
    }, [toggleAllVisible]);

    const galleryItemsNode = items.map((item, index) => {
      const isPdf = item.url && item.url.endsWith('.pdf');

      let props;
      if (item.image) {
        console.log('Es item imagen');
        props = item.image;
      } else {
        props = {
          content: isPdf ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <object
              data={item.url}
              type="application/pdf"
              className={classNames(styles.content, styles.contentPdf)}
            />
          ) : (
            <span className={classNames(styles.content, styles.contentError)}>
              {t('common.thereIsNoPreviewAvailableForThisAttachment')}
            </span>
          ),
        };
      }

      const isVisible = isAllVisible || index < INITIALLY_VISIBLE;
      console.log('item', item);

      return (
        <GalleryItem
          {...props} // eslint-disable-line react/jsx-props-no-spreading
          key={item.id}
          original={item.url}
          caption={item.name}
        >
          {({ ref, open }) =>
            isVisible ? (
              <Item
                ref={ref}
                name={item.name}
                url={item.url}
                coverUrl={item.url}
                createdAt={item.createdAt}
                isPersisted={item.isPersisted}
                canEdit={canEdit}
                onClick={
                  // item.image || isPdf ? open : undefined
                  () => {
                    console.log('Open modal.');
                    setImagenOpen(item.url);
                  }
                }
                onCoverSelect={() => handleCoverSelect(item.id)}
                onCoverDeselect={handleCoverDeselect}
                onUpdate={(data) => handleUpdate(item.id, data)}
                onDelete={() => handleDelete(item.id)}
              />
            ) : (
              <span ref={ref} />
            )
          }
        </GalleryItem>
      );
    });

    return (
      <>
        <Modal
          open={!!imagenOpen}
          onClose={() => {
            setImagenOpen(undefined);
          }}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <div
            style={{
              transform: 'translateX(-25%)',
              backgroundColor: 'white',
              width: '150%',
              aspectRatio: '2',
              height: '700px',
              maxWidth: '1580px',
              overflow: 'auto',
            }}
          >
            <iframe title="Previsualización" src={imagenOpen} width="1200" height="900" />
          </div>
        </Modal>
        <Gallery
          withCaption
          withDownloadButton
          options={{
            wheelToZoom: true,
            showHideAnimationType: 'none',
            closeTitle: '',
            zoomTitle: '',
            arrowPrevTitle: '',
            arrowNextTitle: '',
            errorMsg: '',
          }}
          onBeforeOpen={handleBeforeGalleryOpen}
        >
          {galleryItemsNode}
        </Gallery>
        {items.length > INITIALLY_VISIBLE && (
          <Button
            fluid
            content={
              isAllVisible
                ? t('action.showFewerAttachments')
                : t('action.showAllAttachments', {
                    hidden: items.length - INITIALLY_VISIBLE,
                  })
            }
            className={styles.toggleButton}
            onClick={handleToggleAllVisibleClick}
          />
        )}
      </>
    );
  },
);

Attachments.propTypes = {
  items: PropTypes.array.isRequired, // eslint-disable-line react/forbid-prop-types
  canEdit: PropTypes.bool.isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onCoverUpdate: PropTypes.func.isRequired,
  onGalleryOpen: PropTypes.func.isRequired,
  onGalleryClose: PropTypes.func.isRequired,
};

export default Attachments;
