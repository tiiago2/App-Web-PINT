const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
    
    let modified = false;

    // Change allowNull: false to allowNull: true for updated_*
    if (content.includes('updated_') && content.includes('allowNull: false, defaultValue: DataTypes.NOW')) {
        content = content.replace(/updated_([a-zA-Z0-9_]+):\s*\{\s*type:\s*DataTypes\.DATE,\s*allowNull:\s*false,\s*defaultValue:\s*DataTypes\.NOW\s*\}/g, 
            'updated_$1: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }');
        modified = true;
    }

    // Change allowNull: false to allowNull: true for deleted_*
    if (content.includes('deleted_') && content.includes('allowNull: false, defaultValue: false')) {
        content = content.replace(/deleted_([a-zA-Z0-9_]+):\s*\{\s*type:\s*DataTypes\.BOOLEAN,\s*allowNull:\s*false,\s*defaultValue:\s*false\s*\}/g, 
            'deleted_$1: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false }');
        modified = true;
    }

    // Change defaultScope to handle nulls, and ensure Op is imported
    if (content.includes('defaultScope:') && content.includes('deleted_') && !content.includes('Op.or')) {
        // Ensure Op is required at the top if not present
        if (!content.includes('const { Op }')) {
            content = "const { Op } = require('sequelize');\n" + content;
        }

        content = content.replace(/where:\s*\{\s*deleted_([a-zA-Z0-9_]+):\s*false\s*\}/g, 
            'where: {\n        [Op.or]: [{ deleted_$1: false }, { deleted_$1: null }]\n      }');
        modified = true;
    }

    // Special case for assinatura.js where it uses update_assinatura instead of updated_assinatura
    if (content.includes('update_assinatura:') && content.includes('allowNull: false, defaultValue: DataTypes.NOW')) {
        content = content.replace(/update_assinatura:\s*\{\s*type:\s*DataTypes\.DATE,\s*allowNull:\s*false,\s*defaultValue:\s*DataTypes\.NOW\s*\}/g, 
            'update_assinatura: { type: DataTypes.DATE, allowNull: true, defaultValue: DataTypes.NOW }');
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(path.join(modelsDir, file), content, 'utf8');
        console.log('Patched', file);
    }
});
