/* jshint devel:true */
/* global wpErpCrm */
/* global wp */

;(function($) {
    'use strict';

    var WeDevs_ERP_CRM = {

        initialize: function() {

            // Customer
            $( 'body' ).on( 'click', 'a.erp-contact-new', this.customer.create );
            $( '.erp-crm-customer' ).on( 'click', 'span.edit a', this.customer.edit );
            $( '.erp-crm-customer' ).on( 'click', 'a.submitdelete', this.customer.remove );
            $( '.erp-crm-customer' ).on( 'click', 'a.restoreCustomer', this.customer.restore );

            // Customer single view
            $( '.erp-single-customer' ).on( 'click', 'a#erp-customer-add-company', this.customerSingle.addCompany );

            // photos
            $( 'body' ).on( 'click', 'a#erp-set-customer-photo', this.customer.setPhoto );
            $( 'body' ).on( 'click', 'a.erp-remove-photo', this.customer.removePhoto );
            $( 'body' ).on( 'change', '.erp-customer-form select#erp-customer-type', this.customer.triggerName );

            $( 'body' ).on('change', 'select.erp-country-select', this.populateState );

        },

        /**
         * Populate the state dropdown based on selected country
         *
         * @return {void}
         */
        populateState: function() {

            if ( typeof wpErpCrm.wpErpCountries === 'undefined' ) {
                return false;
            }

            var self = $(this),
                country = self.val(),
                parent = self.closest( self.data('parent') ),
                empty = '<option val="">-------------</option>';

            if ( wpErpCrm.wpErpCountries[ country ] ) {
                var options = '',
                    state = wpErpCrm.wpErpCountries[ country ];

                for ( var index in state ) {
                    options = options + '<option value="' + index + '">' + state[ index ] + '</option>';
                }

                if ( $.isArray( wpErpCrm.wpErpCountries[ country ] ) ) {
                    parent.find('select.erp-state-select').html( empty );
                } else {
                    parent.find('select.erp-state-select').html( options );
                }

            } else {
                parent.find('select.erp-state-select').html( empty );
            }
        },


        customer: {

            /**
             * Set name field according to customer type
             *
             * @return {[void]}
             */
            triggerName: function() {
                var self = $(this),
                    fieldset = self.closest('fieldset');

                if ( self.val() == 'company' ) {
                    fieldset.find('li.name-container input').attr( 'disabled', 'disabled' );
                    fieldset.find('li.customer-company-name input').removeAttr( 'disabled' );
                    fieldset.find('li.name-container').addClass('erp-hide');
                    fieldset.find('li.customer-company-name').removeClass('erp-hide');
                } else {
                    fieldset.find('li.customer-company-name input').attr( 'disabled', 'disabled' );
                    fieldset.find('li.name-container input').removeAttr( 'disabled' );
                    fieldset.find('li.name-container').removeClass('erp-hide');
                    fieldset.find('li.customer-company-name').addClass('erp-hide');
                };
            },

            /**
             * Reload the department area
             *
             * @return {void}
             */
            pageReload: function() {
                $( '.erp-crm-customer' ).load( window.location.href + ' .erp-crm-customer' );
            },

            /**
             * Set photo popup
             *
             * @param {event}
             */
            setPhoto: function(e) {
                e.preventDefault();
                e.stopPropagation();

                var frame;

                if ( frame ) {
                    frame.open();
                    return;
                }

                frame = wp.media({
                    title: wpErpCrm.customer_upload_photo,
                    button: { text: wpErpCrm.customer_set_photo }
                });

                frame.on('select', function() {
                    var selection = frame.state().get('selection');

                    selection.map( function( attachment ) {
                        attachment = attachment.toJSON();

                        var html = '<img src="' + attachment.url + '" alt="" />';
                            html += '<input type="hidden" id="customer-photo-id" name="photo_id" value="' + attachment.id + '" />';
                            html += '<a href="#" class="erp-remove-photo">&times;</a>';

                        $( '.photo-container', '.erp-customer-form' ).html( html );
                    });
                });

                frame.open();
            },

            /**
             * Remove an employees avatar
             *
             * @param  {event}
             */
            removePhoto: function(e) {
                e.preventDefault();

                var html = '<a href="#" id="erp-set-customer-photo" class="button button-small">' + wpErpCrm.customer_upload_photo + '</a>';
                    html += '<input type="hidden" name="photo_id" id="custossmer-photo-id" value="0">';

                $( '.photo-container', '.erp-customer-form' ).html( html );
            },

            /**
             * Create New customer
             *
             * @param  {object} e
             *
             * @return {void}
             */
            create: function(e) {
                e.preventDefault();

                var self = $(this);

                wpErpCrm.customer_empty.type = self.data('type');

                $.erpPopup({
                    title: wpErpCrm.popup.customer_title,
                    button: wpErpCrm.add_submit,
                    id: 'erp-crm-new-contact',
                    content: wperp.template('erp-crm-new-contact')(  wpErpCrm.customer_empty  ).trim(),
                    extraClass: 'midium',
                    onReady: function() {
                        $( '.select2' ).select2();
                        $( 'body' ).find('select#erp-customer-type').trigger('change');
                    },
                    onSubmit: function(modal) {
                        modal.disableButton();

                        wp.ajax.send( {
                            data: this.serialize(),
                            success: function(res) {
                                WeDevs_ERP_CRM.customer.pageReload();
                                modal.enableButton();
                                modal.closeModal();
                            },
                            error: function(error) {
                                modal.enableButton();
                                alert( error );
                            }
                        });
                    }
                }); //popup
            },

            /**
             * Edit customer data
             *
             * @param  {[object]} e
             *
             * @return {[void]}
             */
            edit: function(e) {
                e.preventDefault();

                var self = $(this);

                $.erpPopup({
                    title: wpErpCrm.popup.customer_update_title,
                    button: wpErpCrm.update_submit,
                    id: 'erp-customer-edit',
                    onReady: function() {
                        var modal = this;

                        $( 'header', modal).after( $('<div class="loader"></div>').show() );

                        wp.ajax.send( 'erp-crm-customer-get', {
                            data: {
                                id: self.data( 'id' ),
                                _wpnonce: wpErpCrm.nonce
                            },
                            success: function( response ) {
                                var html = wp.template('erp-crm-new-contact')( response );
                                $( '.content', modal ).html( html );
                                $( '.loader', modal).remove();

                                $( 'li[data-selected]', modal ).each(function() {
                                    var self = $(this),
                                        selected = self.data('selected');

                                    if ( selected !== '' ) {
                                        self.find( 'select' ).val( selected );
                                    }
                                });

                                $('select#erp-customer-type').trigger('change');
                                $( '.select2' ).select2();
                                $( 'select.erp-country-select').change();

                                $( 'li[data-selected]', modal ).each(function() {
                                    var self = $(this),
                                        selected = self.data('selected');

                                    if ( selected !== '' ) {
                                        self.find( 'select' ).val( selected );
                                    }
                                });
                            }
                        });
                    },
                    onSubmit: function(modal) {
                        modal.disableButton();

                        wp.ajax.send( {
                            data: this.serialize(),
                            success: function(response) {
                                WeDevs_ERP_CRM.customer.pageReload();
                                modal.enableButton();
                                modal.closeModal();
                            },
                            error: function(error) {
                                modal.enableButton();
                                alert( error );
                            }
                        });
                    }
                });
            },

            /**
             * Remove customer data with meta
             *
             * @param {object} e
             *
             * @return {[void]}
             */
            remove: function(e) {
                e.preventDefault();

                var self = $(this);

                if ( confirm( wpErpCrm.delConfirmCustomer ) ) {
                    wp.ajax.send( 'erp-crm-customer-delete', {
                        data: {
                            '_wpnonce': wpErpCrm.nonce,
                            id: self.data( 'id' ),
                            hard: self.data( 'hard' )
                        },
                        success: function() {
                            self.closest('tr').fadeOut( 'fast', function() {
                                $(this).remove();
                                WeDevs_ERP_CRM.customer.pageReload();
                            });
                        },
                        error: function(response) {
                            alert( response );
                        }
                    });
                }
            },

            /**
             * Restore customer from trash
             *
             * @param  {[object]} e
             *
             * @return {[void]}
             */
            restore: function(e) {
                e.preventDefault();

                var self = $(this);

                if ( confirm( wpErpCrm.confirm ) ) {
                    wp.ajax.send( 'erp-crm-customer-restore', {
                        data: {
                            '_wpnonce': wpErpCrm.nonce,
                            id: self.data( 'id' ),
                        },
                        success: function() {
                            self.closest('tr').fadeOut( 'fast', function() {
                                $(this).remove();
                                WeDevs_ERP_CRM.customer.pageReload();
                            });
                        },
                        error: function(response) {
                            alert( response );
                        }
                    });
                }
            }
        },

        /**
         * Customer single page functionality
         *
         * @type {Object}
         *
         * @return {mixed}
         */
        customerSingle: {

            addCompany: function(e) {
                e.preventDefault();

                var self = $(this),
                    customer_id = self.data('id');

                $.erpPopup({
                    title: wpErpCrm.popup.customer_title,
                    button: wpErpCrm.add_submit,
                    id: 'erp-crm-single-contact-company',
                    content: wperp.template('erp-crm-new-assign-company')( customer_id ).trim(),
                    extraClass: 'smaller',
                    onReady: function() {
                        WeDevs_ERP_CRM.customerSingle.select2Action('erp-crm-select2');
                        WeDevs_ERP_CRM.customerSingle.select2AddMoreContent();
                    },

                    onSubmit: function(modal) {
                        modal.disableButton();

                        wp.ajax.send( {
                            data: this.serialize(),
                            success: function(res) {
                                WeDevs_ERP_CRM.customer.pageReload();
                                modal.enableButton();
                                modal.closeModal();
                            },
                            error: function(error) {
                                modal.enableButton();
                                alert( error );
                            }
                        });
                    }
                }); //popup
            },

            /**
             * select2 with add more button content
             *
             * @return  {void}
             */
            select2AddMoreContent: function() {
                var selects = $('.erp-hrm-select2-add-more');
                $.each( selects, function( key, element ) {
                   WeDevs_ERP_CRM.customerSingle.select2AddMoreActive(element);
                });
            },

            /**
             * select2 with add more button active
             *
             * @return  {void}
             */
            select2AddMoreActive: function(element) {
                var id = $(element).data('id');

                $(element).select2({
                    width: 'element',
                    "language": {
                        noResults: function(){
                           return '<a href="#" class="button button-primary '+id+'" id="'+id+'">Add New</a>';
                        }
                    },
                    escapeMarkup: function (markup) {
                        return markup;
                    }

                });
            },

            /**
             * select2 action
             *
             * @return  {void}
             */
            select2Action: function(element) {
                $('.'+element).select2({
                    width: 'element',
                });
            },
        }

    }

    $(function() {
        WeDevs_ERP_CRM.initialize();
    });

})(jQuery);