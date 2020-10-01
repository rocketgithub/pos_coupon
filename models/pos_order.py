# -*- encoding: utf-8 -*-

from openerp import models, fields, api, _
from odoo.exceptions import UserError
import logging

class PosOrder(models.Model):
    _inherit = 'pos.order'

    cupones_ids = fields.One2many('sale.coupon','pos_order_id',string="Cupones")

    def is_valid_product_pos(self,programa):
        logging.warn(programa[0])
        valido = False
        programa_id = self.env['sale.coupon.program'].search([('id','=', programa[0])])
        if programa_id:
            valido = programa_id._is_valid_product(programa_id.reward_product_id)
            logging.warn(valido)
        return valido

    def estado_cupon(self,codigo_cupon,estado):
        cupon_id = self.env['sale.coupon'].search([('code','=',codigo_cupon[0]['code'])])
        logging.warn(codigo_cupon)
        logging.warn(estado)
        if cupon_id:
            cupon_id.write({'state': estado[0]})
        return True

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        cupones_ids = []
        for linea in res['lines']:
            if linea[2]['cupon']:
                cupones_ids.append(linea[2]['cupon']['id'])
        logging.warn(cupones_ids)
        res['cupones_ids'] = [(6,0,cupones_ids)]
        return res
