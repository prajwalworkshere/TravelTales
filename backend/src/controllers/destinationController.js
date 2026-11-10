const { pool } = require('../config/db');

// GET /api/destinations
// GET /api/destinations?country=India
// GET /api/destinations?search=goa
// GET /api/destinations?sort=destination_name&order=asc

const getAllDestinations = async (req, res) => {
    try {
        const {
            country,
            search,
            sort,
            order
        } = req.query;

        // Base condition:
        // Public API must return only ACTIVE destinations.
        let sql = `
            SELECT
                destination_id,
                destination_name,
                city,
                state_region,
                country,
                description,
                status,
                created_at,
                updated_at
            FROM destinations
            WHERE status = ?
        `;

        const values = ['ACTIVE'];

        // Optional country filter
        if (country && country.trim() !== '') {
            sql += ` AND country = ?`;
            values.push(country.trim());
        }

        // Optional search filter
        if (search && search.trim() !== '') {
            sql += `
                AND (
                    destination_name LIKE ?
                    OR city LIKE ?
                    OR country LIKE ?
                )
            `;

            const searchValue = `%${search.trim()}%`;

            values.push(
                searchValue,
                searchValue,
                searchValue
            );
        }

        // Allow only approved sorting columns.
        const allowedSortColumns = [
            'destination_name',
            'city',
            'country',
            'created_at'
        ];

        const sortColumn = allowedSortColumns.includes(sort)
            ? sort
            : 'destination_name';

        // Allow only ASC or DESC.
        const sortOrder =
            order && order.toUpperCase() === 'DESC'
                ? 'DESC'
                : 'ASC';

        // Column and direction are selected from allowlists.
        // They are not directly accepted from arbitrary user input.
        sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

        const [destinations] = await pool.execute(sql, values);

        return res.status(200).json({
            success: true,
            count: destinations.length,
            data: destinations
        });

    } catch (error) {
        console.error('Error fetching destinations:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching destinations.'
        });
    }
};


// GET /api/destinations/:id

const getDestinationById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        // Validate ID
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid destination ID.'
            });
        }

        const sql = `
            SELECT
                destination_id,
                destination_name,
                city,
                state_region,
                country,
                description,
                status,
                created_at,
                updated_at
            FROM destinations
            WHERE destination_id = ?
              AND status = ?
        `;

        const [destinations] = await pool.execute(
            sql,
            [id, 'ACTIVE']
        );

        // No matching active destination
        if (destinations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Destination not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: destinations[0]
        });

    } catch (error) {
        console.error('Error fetching destination:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error while fetching destination.'
        });
    }
};


module.exports = {
    getAllDestinations,
    getDestinationById
};