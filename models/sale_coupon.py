# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
import random
from dateutil.relativedelta import relativedelta

from odoo import api, fields, models, _
from odoo.tools import pycompat


class SaleCoupon(models.Model):
    _inherit = 'sale.coupon'

    pos_order_id = fields.Many2one('pos.order', 'Pedido de venta', readonly=True,
        help="Pedido del POS donde fué aplicado el cupón")
