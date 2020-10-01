# -*- encoding: utf-8 -*-

from openerp import models, fields, api, _

class PosConfig(models.Model):
    _inherit = 'pos.config'

    canjear_cupones = fields.Boolean(string="Canjear Cupones")
