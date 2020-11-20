
# -*- coding: utf-8 -*-

{
    'name': 'POS coupon',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'Cupones en POS',
    'description': """ Cupones en POS """,
    'author': 'Aquih',
    'website': 'http://www.aquih.com',
    'depends': ['pos_gt','sale_coupon'],
    'data': [
        'views/pos_config_view.xml',
        'views/sale_coupon_views.xml',
        'views/templates.xml',
    ],
    'qweb': [
        'static/src/xml/pos_coupon_gt.xml',
    ],
    'installable': True,
    'auto_install': False,
}

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
