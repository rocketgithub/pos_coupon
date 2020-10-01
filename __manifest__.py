
# -*- coding: utf-8 -*-

{
    'name': 'POS coupon gt',
    'version': '1.0',
    'category': 'Point of Sale',
    'sequence': 6,
    'summary': 'POS coupon gt',
    'description': """ Cupones en POS """,
    'author': 'Aquih',
    'depends': ['point_of_sale','sale_coupon'],
    'data': [
        'views/pos_config_view.xml',
        'views/templates.xml',
    ],
    'qweb': [
        'static/src/xml/pos_coupon_gt.xml',
    ],
    'installable': True,
    'website': 'http://aquih.com',
    'auto_install': False,
}

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
