odoo.define('pos_coupon.pos_coupon', function (require) {
"use strict";

var screens = require('point_of_sale.screens');
var models = require('point_of_sale.models');
var db = require('point_of_sale.DB');
var rpc = require('web.rpc');
var gui = require('point_of_sale.gui');
var core = require('web.core');
var PopupWidget = require('point_of_sale.popups');
var field_utils = require('web.field_utils');
var QWeb = core.qweb;
var _t = core._t;

var CanjearCuponesButton = screens.ActionButtonWidget.extend({
    template: 'CanjearCuponesButton',
    init: function(parent, options) {
        this._super(parent, options);
        this.pos.bind('change:selectedOrder',this.renderElement,this);
    },
    button_click: function(){
        var self = this;
        var order = this.pos.get_order();
        var gui = this.pos.gui;

        this.gui.show_popup('textinput',{
            'title': 'Ingrese cupon',
            'confirm': function(codigo_cupon) {
                var error_status = self.apply_coupon(order, codigo_cupon)

            },
        });

    },
    apply_coupon: function(order, codigo_cupon){
        var error_status = {}
        var self = this;
        rpc.query({
                model: 'sale.coupon',
                method: 'search_read',
                args: [[['code','=',codigo_cupon]] , []],
            })
            .then(function (cupon){
                if(cupon){
                    error_status = self._check_coupon_code(order,cupon);
                    if ( Object.keys(error_status).length == 0){
                        self._create_reward_line(cupon[0]['program_id'][0],cupon)
                    }else{

                        self.pos.gui.show_popup("error",{
                            "title": "Error",
                            "body":  error_status['error'],
                        });

                    }

                }else{
                    self.pos.gui.show_popup("error",{
                        "title": "Error",
                        "body": 'El código  es inválido',
                    });
                }
            });
    },
    _check_coupon_code: function(order,cupon){
        var message = {};

        var creation_date_order = new Date(order['creation_date']);
        var expiration_coupon_date = new Date(cupon[0]['expiration_date']);

        if( ( ['used','expired'].includes(cupon[0]['state'])) || (expiration_coupon_date  && expiration_coupon_date <  creation_date_order) ){
            message = {'error': 'Este cupón '+ cupon[0]['code'] +' a sido canjeado o a expirado.'}
        }else if(cupon[0]['state'] == 'reserved'){
            message = {'error': 'Este cupón '+cupon[0]['code'] + ' existe, pero la orden de venta de origen aún no está validada'}
        }else if(cupon[0]['partner_id'].length > 0 && cupon[0]['partner_id'][0] != order.get_client().id){
            message = {'error': 'El cliente no tiene acceso a esta recompensa.'}
        }
        return message
    },
    _create_reward_line: function(program,cupon){
        var order = this.pos.get_order();
        var self = this;
        var res_discount = false;
        var res_product = false;

        rpc.query({
                model: 'sale.coupon.program',
                method: 'search_read',
                args: [[['id','=',program]] , []],
            })
            .then(function (programa){
                if(programa[0]['reward_type'] == 'discount'){
                    res_discount = self._get_reward_values_discount(programa)
                    order.add_product(res_discount['product_id'], { price: res_discount['price_unit'], quantity: res_discount['quantity'], extras: { price_manually_set: true } });
                    order.get_last_orderline().set_cupon(cupon);
                    rpc.query({
                            model: 'pos.order',
                            method: 'estado_cupon',
                            args: [[],cupon,['used']],
                        })
                        .then(function (estado){

                        });
                }
                else if(programa[0]['reward_type'] == 'product'){
                    res_product = self._get_reward_values_product(programa,cupon)
                }
            });

    },
    _get_reward_values_discount: function(programa){
        var self = this;
        if(programa[0]['discount_type'] == 'fixed_amount'){
            var product_id = this.pos.db.get_product_by_id(programa[0]['discount_line_product_id'][0]);

            return {
                'product_id': product_id,
                'quantity': 1,
                'price_unit': - self._get_reward_values_discount_fixed_amount(programa)

            }
        }

    },

    _get_reward_values_product: function(programa,cupon){
        var order = this.pos.get_order();
        var price_unit = 0;
        var max_product_qty = 0;
        var self = this;
        var valido = 0;
        var existe_producto_descuento = false;
        order.get_orderlines().forEach(function (orderline) {
            if (orderline.get_product().id == programa[0]['reward_product_id'][0]){
                price_unit = orderline.get_price_with_tax();
                existe_producto_descuento = true;
            }
            max_product_qty +=  orderline.get_quantity();
        });
        if (existe_producto_descuento){
            self._is_valid_product(programa,max_product_qty,price_unit,cupon)
        }else{
            this.pos.gui.show_popup("error",{
                "title": "Error",
                "body":  "Debe de existir el producto",
            });
        }


    },

    _is_valid_product: function(programa,max_product_qty,price_unit,cupon){
        var order = this.pos.get_order();
        var self = this;
        var valido = false;
        var reward_qty = 0;
        var reward_product_qty = 0;
        if (!programa['rule_products_domain']){

            rpc.query({
                    model: 'pos.order',
                    method: 'is_valid_product_pos',
                    args: [[],[programa[0]['id']],[]],
                })
                .then(function (producto_valido_bol){
                    if(producto_valido_bol){
                        reward_product_qty = Math.floor(max_product_qty / (programa[0]['rule_min_quantity'] + programa[0]['reward_product_quantity']))

                    }else{
                        order.get_orderlines().forEach(function (orderline) {
                            if (orderline.get_product().id == programa[0]['reward_product_id'][0]){
                                reward_product_qty = orderline.get_quantity();
                            }
                        });
                    }
                    reward_qty = Math.min( parseInt(parseInt(max_product_qty / programa[0]['rule_min_quantity']) * programa[0]['reward_product_quantity']) , reward_product_qty);
                    var product_id = self.pos.db.get_product_by_id(programa[0]['discount_line_product_id'][0]);

                    order.add_product(product_id, { price: -price_unit, quantity: reward_qty, extras: { price_manually_set: true } });
                    order.get_last_orderline().set_cupon(cupon);

                    rpc.query({
                            model: 'pos.order',
                            method: 'estado_cupon',
                            args: [[],cupon,['used']],
                        })
                        .then(function (estado){

                        });



                });

        }

    },

    _get_paid_order_lines: function(order){
        var total = 0;

        order.get_orderlines().forEach(function (orderline) {
            total += orderline.get_price_with_tax()
        });
        return total
    },
    _get_reward_values_discount_fixed_amount: function(programa){
        var order = this.pos.get_order();
        var self = this;
        var total_amount = self._get_paid_order_lines(order);
        var fixed_amount = programa[0]['discount_fixed_amount'];

        if(total_amount < fixed_amount){
            return total_amount
        }else{
            return fixed_amount
        }

    },

});

screens.define_action_button({
    'name': 'canjearcupones',
    'widget': CanjearCuponesButton,
    'condition': function(){
        return this.pos.config.canjear_cupones;
    },
});


var _super_order = models.Order.prototype;
models.Order = models.Order.extend({
    remove_orderline: function( line ){
        this.assert_editable();
        this.orderlines.remove(line);
        this.select_orderline(this.get_last_orderline());

        if (line.get_cupon().length > 0){
            rpc.query({
                    model: 'pos.order',
                    method: 'estado_cupon',
                    args: [[],line.get_cupon(),['new']],
                })
                .then(function (estado){
                });
        }
    },
});





var _super_order_line = models.Orderline.prototype;
models.Orderline = models.Orderline.extend({
    initialize: function() {
        _super_order_line.initialize.apply(this,arguments);
        this.cupon = this.cupon || false;
    },
    export_as_JSON: function() {
        var json = _super_order_line.export_as_JSON.apply(this,arguments);

        if (this.get_cupon().length > 0){
            json.cupon = this.get_cupon()[0];
        }else{
            json.cupon = false;
        }
        return json;
    },
    set_cupon: function(cupon){
        this.cupon = cupon;
        this.trigger('change',this);
    },

    get_cupon: function(cupon){
        return this.cupon;
    },
})


});
