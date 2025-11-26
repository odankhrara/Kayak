/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
$(document).ready(function() {

    $(".click-title").mouseenter( function(    e){
        e.preventDefault();
        this.style.cursor="pointer";
    });
    $(".click-title").mousedown( function(event){
        event.preventDefault();
    });

    // Ugly code while this script is shared among several pages
    try{
        refreshHitsPerSecond(true);
    } catch(e){}
    try{
        refreshResponseTimeOverTime(true);
    } catch(e){}
    try{
        refreshResponseTimePercentiles();
    } catch(e){}
});


var responseTimePercentilesInfos = {
        data: {"result": {"minY": 1666.0, "minX": 0.0, "maxY": 16782.0, "series": [{"data": [[0.0, 1666.0], [0.1, 1688.0], [0.2, 1780.0], [0.3, 1780.0], [0.4, 1891.0], [0.5, 2125.0], [0.6, 2484.0], [0.7, 2611.0], [0.8, 2665.0], [0.9, 2755.0], [1.0, 2916.0], [1.1, 3326.0], [1.2, 3689.0], [1.3, 3804.0], [1.4, 3804.0], [1.5, 3814.0], [1.6, 3826.0], [1.7, 3837.0], [1.8, 3892.0], [1.9, 3894.0], [2.0, 3910.0], [2.1, 3916.0], [2.2, 3935.0], [2.3, 3946.0], [2.4, 3966.0], [2.5, 4047.0], [2.6, 4054.0], [2.7, 4100.0], [2.8, 4100.0], [2.9, 4117.0], [3.0, 4139.0], [3.1, 4139.0], [3.2, 4141.0], [3.3, 4151.0], [3.4, 4155.0], [3.5, 4161.0], [3.6, 4161.0], [3.7, 4173.0], [3.8, 4210.0], [3.9, 4239.0], [4.0, 4247.0], [4.1, 4265.0], [4.2, 4273.0], [4.3, 4273.0], [4.4, 4277.0], [4.5, 4278.0], [4.6, 4281.0], [4.7, 4293.0], [4.8, 4301.0], [4.9, 4307.0], [5.0, 4312.0], [5.1, 4318.0], [5.2, 4422.0], [5.3, 4431.0], [5.4, 4435.0], [5.5, 4446.0], [5.6, 4517.0], [5.7, 4540.0], [5.8, 4543.0], [5.9, 4553.0], [6.0, 4586.0], [6.1, 4635.0], [6.2, 4636.0], [6.3, 4663.0], [6.4, 4669.0], [6.5, 4673.0], [6.6, 4676.0], [6.7, 4677.0], [6.8, 4683.0], [6.9, 4685.0], [7.0, 4689.0], [7.1, 4693.0], [7.2, 4707.0], [7.3, 4709.0], [7.4, 4710.0], [7.5, 4710.0], [7.6, 4711.0], [7.7, 4718.0], [7.8, 4756.0], [7.9, 4757.0], [8.0, 4758.0], [8.1, 4766.0], [8.2, 4779.0], [8.3, 4781.0], [8.4, 4792.0], [8.5, 4799.0], [8.6, 4809.0], [8.7, 4825.0], [8.8, 4842.0], [8.9, 4845.0], [9.0, 4848.0], [9.1, 4849.0], [9.2, 4861.0], [9.3, 4864.0], [9.4, 4868.0], [9.5, 4883.0], [9.6, 4900.0], [9.7, 4910.0], [9.8, 4911.0], [9.9, 4995.0], [10.0, 5042.0], [10.1, 5153.0], [10.2, 5232.0], [10.3, 5234.0], [10.4, 5438.0], [10.5, 5458.0], [10.6, 5502.0], [10.7, 5591.0], [10.8, 5605.0], [10.9, 5623.0], [11.0, 5624.0], [11.1, 5648.0], [11.2, 5671.0], [11.3, 5710.0], [11.4, 5730.0], [11.5, 5735.0], [11.6, 5745.0], [11.7, 5753.0], [11.8, 5806.0], [11.9, 5844.0], [12.0, 5957.0], [12.1, 5991.0], [12.2, 6011.0], [12.3, 6047.0], [12.4, 6287.0], [12.5, 6340.0], [12.6, 6373.0], [12.7, 6373.0], [12.8, 6373.0], [12.9, 6376.0], [13.0, 6380.0], [13.1, 6382.0], [13.2, 6400.0], [13.3, 6418.0], [13.4, 6433.0], [13.5, 6446.0], [13.6, 6472.0], [13.7, 6473.0], [13.8, 6479.0], [13.9, 6481.0], [14.0, 6483.0], [14.1, 6490.0], [14.2, 6491.0], [14.3, 6496.0], [14.4, 6498.0], [14.5, 6528.0], [14.6, 6530.0], [14.7, 6530.0], [14.8, 6534.0], [14.9, 6535.0], [15.0, 6536.0], [15.1, 6541.0], [15.2, 6543.0], [15.3, 6547.0], [15.4, 6549.0], [15.5, 6572.0], [15.6, 6575.0], [15.7, 6575.0], [15.8, 6578.0], [15.9, 6579.0], [16.0, 6579.0], [16.1, 6580.0], [16.2, 6581.0], [16.3, 6585.0], [16.4, 6590.0], [16.5, 6592.0], [16.6, 6593.0], [16.7, 6595.0], [16.8, 6595.0], [16.9, 6598.0], [17.0, 6598.0], [17.1, 6610.0], [17.2, 6613.0], [17.3, 6620.0], [17.4, 6624.0], [17.5, 6625.0], [17.6, 6625.0], [17.7, 6626.0], [17.8, 6632.0], [17.9, 6638.0], [18.0, 6641.0], [18.1, 6641.0], [18.2, 6644.0], [18.3, 6651.0], [18.4, 6656.0], [18.5, 6656.0], [18.6, 6657.0], [18.7, 6658.0], [18.8, 6659.0], [18.9, 6659.0], [19.0, 6659.0], [19.1, 6661.0], [19.2, 6662.0], [19.3, 6662.0], [19.4, 6663.0], [19.5, 6663.0], [19.6, 6663.0], [19.7, 6663.0], [19.8, 6663.0], [19.9, 6665.0], [20.0, 6666.0], [20.1, 6667.0], [20.2, 6669.0], [20.3, 6669.0], [20.4, 6670.0], [20.5, 6670.0], [20.6, 6671.0], [20.7, 6672.0], [20.8, 6672.0], [20.9, 6672.0], [21.0, 6672.0], [21.1, 6674.0], [21.2, 6674.0], [21.3, 6677.0], [21.4, 6684.0], [21.5, 6690.0], [21.6, 6691.0], [21.7, 6702.0], [21.8, 6704.0], [21.9, 6709.0], [22.0, 6711.0], [22.1, 6760.0], [22.2, 6764.0], [22.3, 6775.0], [22.4, 6775.0], [22.5, 6780.0], [22.6, 6784.0], [22.7, 6795.0], [22.8, 6809.0], [22.9, 6825.0], [23.0, 6840.0], [23.1, 6858.0], [23.2, 6877.0], [23.3, 6887.0], [23.4, 6925.0], [23.5, 6939.0], [23.6, 6944.0], [23.7, 6961.0], [23.8, 6984.0], [23.9, 6985.0], [24.0, 6987.0], [24.1, 6990.0], [24.2, 6996.0], [24.3, 6998.0], [24.4, 7001.0], [24.5, 7002.0], [24.6, 7005.0], [24.7, 7008.0], [24.8, 7008.0], [24.9, 7008.0], [25.0, 7010.0], [25.1, 7013.0], [25.2, 7014.0], [25.3, 7016.0], [25.4, 7018.0], [25.5, 7021.0], [25.6, 7022.0], [25.7, 7027.0], [25.8, 7029.0], [25.9, 7030.0], [26.0, 7030.0], [26.1, 7038.0], [26.2, 7054.0], [26.3, 7056.0], [26.4, 7063.0], [26.5, 7075.0], [26.6, 7080.0], [26.7, 7081.0], [26.8, 7086.0], [26.9, 7101.0], [27.0, 7108.0], [27.1, 7114.0], [27.2, 7128.0], [27.3, 7138.0], [27.4, 7146.0], [27.5, 7146.0], [27.6, 7167.0], [27.7, 7167.0], [27.8, 7169.0], [27.9, 7172.0], [28.0, 7177.0], [28.1, 7179.0], [28.2, 7180.0], [28.3, 7181.0], [28.4, 7182.0], [28.5, 7183.0], [28.6, 7185.0], [28.7, 7185.0], [28.8, 7186.0], [28.9, 7186.0], [29.0, 7189.0], [29.1, 7190.0], [29.2, 7199.0], [29.3, 7204.0], [29.4, 7208.0], [29.5, 7209.0], [29.6, 7209.0], [29.7, 7220.0], [29.8, 7231.0], [29.9, 7232.0], [30.0, 7234.0], [30.1, 7236.0], [30.2, 7236.0], [30.3, 7237.0], [30.4, 7251.0], [30.5, 7263.0], [30.6, 7264.0], [30.7, 7265.0], [30.8, 7270.0], [30.9, 7271.0], [31.0, 7272.0], [31.1, 7285.0], [31.2, 7287.0], [31.3, 7288.0], [31.4, 7296.0], [31.5, 7316.0], [31.6, 7328.0], [31.7, 7329.0], [31.8, 7341.0], [31.9, 7361.0], [32.0, 7363.0], [32.1, 7378.0], [32.2, 7379.0], [32.3, 7386.0], [32.4, 7386.0], [32.5, 7402.0], [32.6, 7415.0], [32.7, 7416.0], [32.8, 7418.0], [32.9, 7421.0], [33.0, 7422.0], [33.1, 7426.0], [33.2, 7429.0], [33.3, 7433.0], [33.4, 7434.0], [33.5, 7434.0], [33.6, 7438.0], [33.7, 7441.0], [33.8, 7442.0], [33.9, 7444.0], [34.0, 7445.0], [34.1, 7446.0], [34.2, 7454.0], [34.3, 7463.0], [34.4, 7467.0], [34.5, 7472.0], [34.6, 7473.0], [34.7, 7477.0], [34.8, 7480.0], [34.9, 7485.0], [35.0, 7486.0], [35.1, 7489.0], [35.2, 7491.0], [35.3, 7494.0], [35.4, 7506.0], [35.5, 7514.0], [35.6, 7516.0], [35.7, 7517.0], [35.8, 7521.0], [35.9, 7525.0], [36.0, 7525.0], [36.1, 7528.0], [36.2, 7529.0], [36.3, 7529.0], [36.4, 7529.0], [36.5, 7537.0], [36.6, 7543.0], [36.7, 7544.0], [36.8, 7550.0], [36.9, 7559.0], [37.0, 7612.0], [37.1, 7613.0], [37.2, 7616.0], [37.3, 7624.0], [37.4, 7626.0], [37.5, 7628.0], [37.6, 7632.0], [37.7, 7633.0], [37.8, 7634.0], [37.9, 7639.0], [38.0, 7641.0], [38.1, 7643.0], [38.2, 7643.0], [38.3, 7648.0], [38.4, 7651.0], [38.5, 7651.0], [38.6, 7655.0], [38.7, 7657.0], [38.8, 7660.0], [38.9, 7661.0], [39.0, 7662.0], [39.1, 7663.0], [39.2, 7663.0], [39.3, 7664.0], [39.4, 7665.0], [39.5, 7667.0], [39.6, 7668.0], [39.7, 7670.0], [39.8, 7673.0], [39.9, 7673.0], [40.0, 7673.0], [40.1, 7674.0], [40.2, 7678.0], [40.3, 7683.0], [40.4, 7687.0], [40.5, 7698.0], [40.6, 7704.0], [40.7, 7711.0], [40.8, 7714.0], [40.9, 7735.0], [41.0, 7739.0], [41.1, 7751.0], [41.2, 7767.0], [41.3, 7806.0], [41.4, 7809.0], [41.5, 7848.0], [41.6, 7866.0], [41.7, 7870.0], [41.8, 7870.0], [41.9, 7876.0], [42.0, 7893.0], [42.1, 7902.0], [42.2, 7911.0], [42.3, 7926.0], [42.4, 7927.0], [42.5, 7936.0], [42.6, 7938.0], [42.7, 7958.0], [42.8, 7975.0], [42.9, 7999.0], [43.0, 8001.0], [43.1, 8019.0], [43.2, 8022.0], [43.3, 8023.0], [43.4, 8027.0], [43.5, 8039.0], [43.6, 8044.0], [43.7, 8046.0], [43.8, 8048.0], [43.9, 8056.0], [44.0, 8058.0], [44.1, 8059.0], [44.2, 8059.0], [44.3, 8061.0], [44.4, 8067.0], [44.5, 8068.0], [44.6, 8069.0], [44.7, 8069.0], [44.8, 8071.0], [44.9, 8080.0], [45.0, 8080.0], [45.1, 8082.0], [45.2, 8082.0], [45.3, 8084.0], [45.4, 8085.0], [45.5, 8089.0], [45.6, 8091.0], [45.7, 8094.0], [45.8, 8096.0], [45.9, 8105.0], [46.0, 8124.0], [46.1, 8144.0], [46.2, 8185.0], [46.3, 8194.0], [46.4, 8209.0], [46.5, 8210.0], [46.6, 8215.0], [46.7, 8219.0], [46.8, 8236.0], [46.9, 8236.0], [47.0, 8242.0], [47.1, 8253.0], [47.2, 8267.0], [47.3, 8271.0], [47.4, 8276.0], [47.5, 8277.0], [47.6, 8277.0], [47.7, 8278.0], [47.8, 8317.0], [47.9, 8326.0], [48.0, 8341.0], [48.1, 8358.0], [48.2, 8365.0], [48.3, 8368.0], [48.4, 8375.0], [48.5, 8378.0], [48.6, 8393.0], [48.7, 8422.0], [48.8, 8529.0], [48.9, 8541.0], [49.0, 8605.0], [49.1, 8613.0], [49.2, 8648.0], [49.3, 8659.0], [49.4, 9117.0], [49.5, 9691.0], [49.6, 9828.0], [49.7, 9829.0], [49.8, 9850.0], [49.9, 9864.0], [50.0, 9889.0], [50.1, 9913.0], [50.2, 9956.0], [50.3, 9984.0], [50.4, 9991.0], [50.5, 10003.0], [50.6, 10007.0], [50.7, 10014.0], [50.8, 10099.0], [50.9, 10114.0], [51.0, 10750.0], [51.1, 10805.0], [51.2, 10808.0], [51.3, 10829.0], [51.4, 10852.0], [51.5, 11093.0], [51.6, 11165.0], [51.7, 11240.0], [51.8, 11269.0], [51.9, 11280.0], [52.0, 11306.0], [52.1, 11346.0], [52.2, 11366.0], [52.3, 11512.0], [52.4, 11703.0], [52.5, 11734.0], [52.6, 11757.0], [52.7, 11758.0], [52.8, 11777.0], [52.9, 11816.0], [53.0, 11886.0], [53.1, 11933.0], [53.2, 12015.0], [53.3, 12068.0], [53.4, 12157.0], [53.5, 12171.0], [53.6, 12225.0], [53.7, 12232.0], [53.8, 12234.0], [53.9, 12235.0], [54.0, 12236.0], [54.1, 12237.0], [54.2, 12239.0], [54.3, 12243.0], [54.4, 12244.0], [54.5, 12249.0], [54.6, 12253.0], [54.7, 12265.0], [54.8, 12266.0], [54.9, 12268.0], [55.0, 12269.0], [55.1, 12270.0], [55.2, 12271.0], [55.3, 12275.0], [55.4, 12276.0], [55.5, 12276.0], [55.6, 12276.0], [55.7, 12277.0], [55.8, 12278.0], [55.9, 12283.0], [56.0, 12284.0], [56.1, 12286.0], [56.2, 12288.0], [56.3, 12288.0], [56.4, 12291.0], [56.5, 12293.0], [56.6, 12296.0], [56.7, 12296.0], [56.8, 12298.0], [56.9, 12299.0], [57.0, 12315.0], [57.1, 12316.0], [57.2, 12319.0], [57.3, 12320.0], [57.4, 12322.0], [57.5, 12327.0], [57.6, 12331.0], [57.7, 12339.0], [57.8, 12345.0], [57.9, 12353.0], [58.0, 12358.0], [58.1, 12367.0], [58.2, 12367.0], [58.3, 12368.0], [58.4, 12392.0], [58.5, 12392.0], [58.6, 12399.0], [58.7, 12404.0], [58.8, 12411.0], [58.9, 12412.0], [59.0, 12414.0], [59.1, 12416.0], [59.2, 12444.0], [59.3, 12462.0], [59.4, 12464.0], [59.5, 12496.0], [59.6, 12500.0], [59.7, 12505.0], [59.8, 12513.0], [59.9, 12516.0], [60.0, 12516.0], [60.1, 12517.0], [60.2, 12519.0], [60.3, 12523.0], [60.4, 12524.0], [60.5, 12529.0], [60.6, 12530.0], [60.7, 12533.0], [60.8, 12534.0], [60.9, 12537.0], [61.0, 12539.0], [61.1, 12540.0], [61.2, 12541.0], [61.3, 12542.0], [61.4, 12542.0], [61.5, 12543.0], [61.6, 12550.0], [61.7, 12556.0], [61.8, 12565.0], [61.9, 12565.0], [62.0, 12647.0], [62.1, 12677.0], [62.2, 12687.0], [62.3, 12879.0], [62.4, 12883.0], [62.5, 12919.0], [62.6, 13042.0], [62.7, 13042.0], [62.8, 13050.0], [62.9, 13074.0], [63.0, 13081.0], [63.1, 13126.0], [63.2, 13127.0], [63.3, 13137.0], [63.4, 13149.0], [63.5, 13174.0], [63.6, 13177.0], [63.7, 13185.0], [63.8, 13190.0], [63.9, 13191.0], [64.0, 13192.0], [64.1, 13192.0], [64.2, 13208.0], [64.3, 13213.0], [64.4, 13215.0], [64.5, 13215.0], [64.6, 13227.0], [64.7, 13243.0], [64.8, 13264.0], [64.9, 13290.0], [65.0, 13302.0], [65.1, 13305.0], [65.2, 13308.0], [65.3, 13312.0], [65.4, 13318.0], [65.5, 13320.0], [65.6, 13325.0], [65.7, 13342.0], [65.8, 13361.0], [65.9, 13364.0], [66.0, 13364.0], [66.1, 13372.0], [66.2, 13374.0], [66.3, 13377.0], [66.4, 13378.0], [66.5, 13382.0], [66.6, 13413.0], [66.7, 13440.0], [66.8, 13448.0], [66.9, 13458.0], [67.0, 13458.0], [67.1, 13459.0], [67.2, 13472.0], [67.3, 13482.0], [67.4, 13496.0], [67.5, 13503.0], [67.6, 13504.0], [67.7, 13548.0], [67.8, 13559.0], [67.9, 13585.0], [68.0, 13615.0], [68.1, 13644.0], [68.2, 13646.0], [68.3, 13648.0], [68.4, 13650.0], [68.5, 13669.0], [68.6, 13694.0], [68.7, 13707.0], [68.8, 13755.0], [68.9, 13807.0], [69.0, 13816.0], [69.1, 13825.0], [69.2, 13859.0], [69.3, 13950.0], [69.4, 13975.0], [69.5, 14026.0], [69.6, 14026.0], [69.7, 14032.0], [69.8, 14053.0], [69.9, 14076.0], [70.0, 14077.0], [70.1, 14083.0], [70.2, 14084.0], [70.3, 14096.0], [70.4, 14137.0], [70.5, 14179.0], [70.6, 14220.0], [70.7, 14234.0], [70.8, 14235.0], [70.9, 14273.0], [71.0, 14305.0], [71.1, 14320.0], [71.2, 14335.0], [71.3, 14341.0], [71.4, 14344.0], [71.5, 14348.0], [71.6, 14350.0], [71.7, 14357.0], [71.8, 14364.0], [71.9, 14447.0], [72.0, 14460.0], [72.1, 14485.0], [72.2, 14495.0], [72.3, 14496.0], [72.4, 14512.0], [72.5, 14543.0], [72.6, 14547.0], [72.7, 14576.0], [72.8, 14582.0], [72.9, 14584.0], [73.0, 14585.0], [73.1, 14586.0], [73.2, 14588.0], [73.3, 14589.0], [73.4, 14592.0], [73.5, 14595.0], [73.6, 14598.0], [73.7, 14599.0], [73.8, 14599.0], [73.9, 14604.0], [74.0, 14608.0], [74.1, 14623.0], [74.2, 14627.0], [74.3, 14627.0], [74.4, 14633.0], [74.5, 14642.0], [74.6, 14650.0], [74.7, 14668.0], [74.8, 14669.0], [74.9, 14669.0], [75.0, 14669.0], [75.1, 14670.0], [75.2, 14670.0], [75.3, 14671.0], [75.4, 14694.0], [75.5, 14744.0], [75.6, 14745.0], [75.7, 14745.0], [75.8, 14748.0], [75.9, 14774.0], [76.0, 14779.0], [76.1, 14794.0], [76.2, 14809.0], [76.3, 14813.0], [76.4, 14835.0], [76.5, 14844.0], [76.6, 14847.0], [76.7, 14850.0], [76.8, 14850.0], [76.9, 14854.0], [77.0, 14855.0], [77.1, 14857.0], [77.2, 14857.0], [77.3, 14858.0], [77.4, 14859.0], [77.5, 14862.0], [77.6, 14865.0], [77.7, 14866.0], [77.8, 14867.0], [77.9, 14867.0], [78.0, 14873.0], [78.1, 14881.0], [78.2, 14883.0], [78.3, 14892.0], [78.4, 14895.0], [78.5, 14896.0], [78.6, 14897.0], [78.7, 14897.0], [78.8, 14939.0], [78.9, 14988.0], [79.0, 15016.0], [79.1, 15018.0], [79.2, 15341.0], [79.3, 15464.0], [79.4, 15469.0], [79.5, 15488.0], [79.6, 15491.0], [79.7, 15498.0], [79.8, 15498.0], [79.9, 15510.0], [80.0, 15529.0], [80.1, 15530.0], [80.2, 15531.0], [80.3, 15571.0], [80.4, 15578.0], [80.5, 15582.0], [80.6, 15583.0], [80.7, 15588.0], [80.8, 15597.0], [80.9, 15607.0], [81.0, 15615.0], [81.1, 15615.0], [81.2, 15616.0], [81.3, 15617.0], [81.4, 15617.0], [81.5, 15617.0], [81.6, 15618.0], [81.7, 15619.0], [81.8, 15619.0], [81.9, 15620.0], [82.0, 15620.0], [82.1, 15621.0], [82.2, 15621.0], [82.3, 15624.0], [82.4, 15624.0], [82.5, 15625.0], [82.6, 15626.0], [82.7, 15627.0], [82.8, 15627.0], [82.9, 15629.0], [83.0, 15629.0], [83.1, 15630.0], [83.2, 15631.0], [83.3, 15633.0], [83.4, 15633.0], [83.5, 15635.0], [83.6, 15638.0], [83.7, 15639.0], [83.8, 15640.0], [83.9, 15640.0], [84.0, 15642.0], [84.1, 15642.0], [84.2, 15643.0], [84.3, 15646.0], [84.4, 15648.0], [84.5, 15651.0], [84.6, 15652.0], [84.7, 15654.0], [84.8, 15656.0], [84.9, 15656.0], [85.0, 15661.0], [85.1, 15663.0], [85.2, 15664.0], [85.3, 15666.0], [85.4, 15666.0], [85.5, 15667.0], [85.6, 15667.0], [85.7, 15668.0], [85.8, 15672.0], [85.9, 15681.0], [86.0, 15683.0], [86.1, 15683.0], [86.2, 15688.0], [86.3, 15689.0], [86.4, 15697.0], [86.5, 15700.0], [86.6, 15708.0], [86.7, 15709.0], [86.8, 15710.0], [86.9, 15711.0], [87.0, 15711.0], [87.1, 15715.0], [87.2, 15718.0], [87.3, 15719.0], [87.4, 15720.0], [87.5, 15721.0], [87.6, 15722.0], [87.7, 15723.0], [87.8, 15724.0], [87.9, 15726.0], [88.0, 15727.0], [88.1, 15728.0], [88.2, 15733.0], [88.3, 15744.0], [88.4, 15749.0], [88.5, 15754.0], [88.6, 15756.0], [88.7, 15760.0], [88.8, 15767.0], [88.9, 15768.0], [89.0, 15770.0], [89.1, 15775.0], [89.2, 15776.0], [89.3, 15784.0], [89.4, 15788.0], [89.5, 15789.0], [89.6, 15792.0], [89.7, 15796.0], [89.8, 15796.0], [89.9, 15797.0], [90.0, 15799.0], [90.1, 15801.0], [90.2, 15803.0], [90.3, 15806.0], [90.4, 15810.0], [90.5, 15812.0], [90.6, 15816.0], [90.7, 15817.0], [90.8, 15819.0], [90.9, 15819.0], [91.0, 15820.0], [91.1, 15822.0], [91.2, 15822.0], [91.3, 15823.0], [91.4, 15827.0], [91.5, 15828.0], [91.6, 15849.0], [91.7, 15864.0], [91.8, 15881.0], [91.9, 15890.0], [92.0, 15890.0], [92.1, 15892.0], [92.2, 15893.0], [92.3, 15895.0], [92.4, 15895.0], [92.5, 15896.0], [92.6, 15897.0], [92.7, 15897.0], [92.8, 15898.0], [92.9, 15899.0], [93.0, 15901.0], [93.1, 15901.0], [93.2, 15901.0], [93.3, 15906.0], [93.4, 15908.0], [93.5, 15909.0], [93.6, 15913.0], [93.7, 15913.0], [93.8, 15914.0], [93.9, 15916.0], [94.0, 15917.0], [94.1, 15919.0], [94.2, 15923.0], [94.3, 15924.0], [94.4, 15924.0], [94.5, 15925.0], [94.6, 15927.0], [94.7, 15930.0], [94.8, 15932.0], [94.9, 15933.0], [95.0, 15934.0], [95.1, 15935.0], [95.2, 15939.0], [95.3, 15947.0], [95.4, 15964.0], [95.5, 15967.0], [95.6, 15976.0], [95.7, 15979.0], [95.8, 16017.0], [95.9, 16035.0], [96.0, 16043.0], [96.1, 16059.0], [96.2, 16063.0], [96.3, 16089.0], [96.4, 16095.0], [96.5, 16104.0], [96.6, 16108.0], [96.7, 16121.0], [96.8, 16123.0], [96.9, 16139.0], [97.0, 16153.0], [97.1, 16167.0], [97.2, 16182.0], [97.3, 16182.0], [97.4, 16194.0], [97.5, 16230.0], [97.6, 16250.0], [97.7, 16253.0], [97.8, 16258.0], [97.9, 16265.0], [98.0, 16270.0], [98.1, 16280.0], [98.2, 16287.0], [98.3, 16307.0], [98.4, 16308.0], [98.5, 16317.0], [98.6, 16335.0], [98.7, 16340.0], [98.8, 16361.0], [98.9, 16385.0], [99.0, 16401.0], [99.1, 16413.0], [99.2, 16469.0], [99.3, 16491.0], [99.4, 16491.0], [99.5, 16549.0], [99.6, 16552.0], [99.7, 16662.0], [99.8, 16744.0], [99.9, 16782.0]], "isOverall": false, "label": "Warm-up: Search Flights", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 100.0, "title": "Response Time Percentiles"}},
        getOptions: function() {
            return {
                series: {
                    points: { show: false }
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentiles'
                },
                xaxis: {
                    tickDecimals: 1,
                    axisLabel: "Percentiles",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Percentile value in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : %x.2 percentile was %y ms"
                },
                selection: { mode: "xy" },
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentiles"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesPercentiles"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesPercentiles"), dataset, prepareOverviewOptions(options));
        }
};

/**
 * @param elementId Id of element where we display message
 */
function setEmptyGraph(elementId) {
    $(function() {
        $(elementId).text("No graph series with filter="+seriesFilter);
    });
}

// Response times percentiles
function refreshResponseTimePercentiles() {
    var infos = responseTimePercentilesInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimePercentiles");
        return;
    }
    if (isGraph($("#flotResponseTimesPercentiles"))){
        infos.createGraph();
    } else {
        var choiceContainer = $("#choicesResponseTimePercentiles");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesPercentiles", "#overviewResponseTimesPercentiles");
        $('#bodyResponseTimePercentiles .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimeDistributionInfos = {
        data: {"result": {"minY": 1.0, "minX": 1600.0, "maxY": 56.0, "series": [{"data": [[1600.0, 2.0], [1700.0, 2.0], [1800.0, 1.0], [2100.0, 1.0], [2400.0, 1.0], [2600.0, 2.0], [2700.0, 1.0], [2900.0, 1.0], [3300.0, 1.0], [3600.0, 1.0], [3800.0, 6.0], [3900.0, 5.0], [4000.0, 2.0], [4100.0, 11.0], [4200.0, 11.0], [4300.0, 4.0], [4400.0, 4.0], [4600.0, 11.0], [4500.0, 5.0], [4800.0, 10.0], [4700.0, 14.0], [4900.0, 4.0], [5000.0, 1.0], [5100.0, 1.0], [5200.0, 2.0], [5600.0, 5.0], [5400.0, 2.0], [5500.0, 2.0], [5800.0, 2.0], [5700.0, 5.0], [5900.0, 2.0], [6000.0, 2.0], [6300.0, 7.0], [6200.0, 1.0], [6500.0, 26.0], [6400.0, 13.0], [6600.0, 46.0], [6900.0, 10.0], [6800.0, 6.0], [6700.0, 10.0], [7100.0, 24.0], [7000.0, 25.0], [7200.0, 22.0], [7400.0, 29.0], [7300.0, 10.0], [7600.0, 36.0], [7500.0, 16.0], [7800.0, 8.0], [7700.0, 7.0], [7900.0, 9.0], [8100.0, 5.0], [8000.0, 29.0], [8300.0, 9.0], [8600.0, 4.0], [8200.0, 14.0], [8500.0, 2.0], [8400.0, 1.0], [9100.0, 1.0], [9600.0, 1.0], [9900.0, 4.0], [9800.0, 5.0], [10100.0, 1.0], [10000.0, 4.0], [10700.0, 1.0], [11100.0, 1.0], [11200.0, 3.0], [10800.0, 4.0], [11000.0, 1.0], [11300.0, 3.0], [11700.0, 5.0], [11500.0, 1.0], [12200.0, 34.0], [12100.0, 2.0], [11800.0, 2.0], [12000.0, 2.0], [11900.0, 1.0], [12400.0, 9.0], [12600.0, 3.0], [12300.0, 17.0], [12500.0, 24.0], [13200.0, 8.0], [13100.0, 11.0], [13300.0, 16.0], [12800.0, 2.0], [13000.0, 5.0], [12900.0, 1.0], [13400.0, 9.0], [13800.0, 4.0], [13500.0, 5.0], [13600.0, 7.0], [13700.0, 2.0], [14000.0, 9.0], [14300.0, 9.0], [14200.0, 4.0], [14100.0, 2.0], [13900.0, 2.0], [14400.0, 5.0], [14600.0, 17.0], [14500.0, 15.0], [14800.0, 26.0], [14700.0, 7.0], [15300.0, 1.0], [15000.0, 2.0], [14900.0, 2.0], [15600.0, 56.0], [15800.0, 29.0], [15700.0, 36.0], [15500.0, 10.0], [15400.0, 6.0], [16300.0, 7.0], [15900.0, 28.0], [16200.0, 8.0], [16100.0, 10.0], [16000.0, 7.0], [16400.0, 5.0], [16700.0, 2.0], [16600.0, 1.0], [16500.0, 2.0]], "isOverall": false, "label": "Warm-up: Search Flights", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 100, "maxX": 16700.0, "title": "Response Time Distribution"}},
        getOptions: function() {
            var granularity = this.data.result.granularity;
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    barWidth: this.data.result.granularity
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " responses for " + label + " were between " + xval + " and " + (xval + granularity) + " ms";
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimeDistribution"), prepareData(data.result.series, $("#choicesResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshResponseTimeDistribution() {
    var infos = responseTimeDistributionInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeDistribution");
        return;
    }
    if (isGraph($("#flotResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var syntheticResponseTimeDistributionInfos = {
        data: {"result": {"minY": 1000.0, "minX": 3.0, "ticks": [[0, "Requests having \nresponse time <= 500ms"], [1, "Requests having \nresponse time > 500ms and <= 1,500ms"], [2, "Requests having \nresponse time > 1,500ms"], [3, "Requests in error"]], "maxY": 1000.0, "series": [{"data": [], "color": "#9ACD32", "isOverall": false, "label": "Requests having \nresponse time <= 500ms", "isController": false}, {"data": [], "color": "yellow", "isOverall": false, "label": "Requests having \nresponse time > 500ms and <= 1,500ms", "isController": false}, {"data": [], "color": "orange", "isOverall": false, "label": "Requests having \nresponse time > 1,500ms", "isController": false}, {"data": [[3.0, 1000.0]], "color": "#FF6347", "isOverall": false, "label": "Requests in error", "isController": false}], "supportsControllersDiscrimination": false, "maxX": 3.0, "title": "Synthetic Response Times Distribution"}},
        getOptions: function() {
            return {
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendSyntheticResponseTimeDistribution'
                },
                xaxis:{
                    axisLabel: "Response times ranges",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                    tickLength:0,
                    min:-0.5,
                    max:3.5
                },
                yaxis: {
                    axisLabel: "Number of responses",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                bars : {
                    show: true,
                    align: "center",
                    barWidth: 0.25,
                    fill:.75
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: function(label, xval, yval, flotItem){
                        return yval + " " + label;
                    }
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var options = this.getOptions();
            prepareOptions(options, data);
            options.xaxis.ticks = data.result.ticks;
            $.plot($("#flotSyntheticResponseTimeDistribution"), prepareData(data.result.series, $("#choicesSyntheticResponseTimeDistribution")), options);
        }

};

// Response time distribution
function refreshSyntheticResponseTimeDistribution() {
    var infos = syntheticResponseTimeDistributionInfos;
    prepareSeries(infos.data, true);
    if (isGraph($("#flotSyntheticResponseTimeDistribution"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        $('#footerSyntheticResponseTimeDistribution .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var activeThreadsOverTimeInfos = {
        data: {"result": {"minY": 834.6309999999995, "minX": 1.76412426E12, "maxY": 834.6309999999995, "series": [{"data": [[1.76412426E12, 834.6309999999995]], "isOverall": false, "label": "Cache Warm-up Thread Group", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76412426E12, "title": "Active Threads Over Time"}},
        getOptions: function() {
            return {
                series: {
                    stack: true,
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 6,
                    show: true,
                    container: '#legendActiveThreadsOverTime'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                selection: {
                    mode: 'xy'
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : At %x there were %y active threads"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesActiveThreadsOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotActiveThreadsOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewActiveThreadsOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Active Threads Over Time
function refreshActiveThreadsOverTime(fixTimestamps) {
    var infos = activeThreadsOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotActiveThreadsOverTime"))) {
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesActiveThreadsOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotActiveThreadsOverTime", "#overviewActiveThreadsOverTime");
        $('#footerActiveThreadsOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var timeVsThreadsInfos = {
        data: {"result": {"minY": 5605.0, "minX": 619.0, "maxY": 16744.0, "series": [{"data": [[622.0, 7709.0], [619.0, 7418.0], [623.0, 8341.0], [669.0, 7038.0], [697.0, 11365.714285714284], [691.0, 10572.714285714284], [677.0, 6825.0], [673.0, 16744.0], [685.0, 9287.25], [675.0, 14412.5], [676.0, 11727.0], [694.0, 15571.0], [695.0, 8086.0], [693.0, 10534.666666666666], [717.0, 11079.2], [711.0, 11550.583333333334], [710.0, 10449.0], [713.0, 7625.5], [712.0, 13756.8], [715.0, 15789.0], [742.0, 10088.2], [746.0, 10224.540816326531], [757.0, 11539.066666666666], [765.0, 11078.257575757574], [758.0, 10732.088235294115], [759.0, 10315.666666666668], [744.0, 10890.264957264953], [745.0, 11323.333333333334], [763.0, 15714.0], [764.0, 15706.0], [760.0, 10690.807692307695], [762.0, 11947.6], [780.0, 11291.75], [769.0, 11454.0], [923.0, 13353.249999999998], [909.0, 9208.666666666666], [905.0, 11530.666666666666], [926.0, 12056.192307692307], [907.0, 13625.07142857143], [908.0, 13138.0], [917.0, 14269.857142857143], [915.0, 12878.333333333334], [914.0, 14485.0], [922.0, 14586.0], [910.0, 10499.0], [925.0, 8496.5], [924.0, 14775.5], [906.0, 14703.666666666666], [948.0, 13755.0], [947.0, 13619.6], [932.0, 6467.5], [929.0, 5605.0], [962.0, 12931.333333333332], [961.0, 14564.0], [965.0, 6990.0], [972.0, 14341.0], [1000.0, 8500.737288135597], [998.0, 13020.733333333334], [994.0, 13644.0], [993.0, 10684.666666666666], [992.0, 5735.0], [999.0, 9995.5]], "isOverall": false, "label": "Warm-up: Search Flights", "isController": false}, {"data": [[834.3030000000005, 10474.812999999993]], "isOverall": false, "label": "Warm-up: Search Flights-Aggregated", "isController": false}], "supportsControllersDiscrimination": true, "maxX": 1000.0, "title": "Time VS Threads"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    axisLabel: "Number of active threads",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response times in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: { noColumns: 2,show: true, container: '#legendTimeVsThreads' },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s: At %x.2 active threads, Average response time was %y.2 ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesTimeVsThreads"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotTimesVsThreads"), dataset, options);
            // setup overview
            $.plot($("#overviewTimesVsThreads"), dataset, prepareOverviewOptions(options));
        }
};

// Time vs threads
function refreshTimeVsThreads(){
    var infos = timeVsThreadsInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTimeVsThreads");
        return;
    }
    if(isGraph($("#flotTimesVsThreads"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTimeVsThreads");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTimesVsThreads", "#overviewTimesVsThreads");
        $('#footerTimeVsThreads .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var bytesThroughputOverTimeInfos = {
        data : {"result": {"minY": 2741.2, "minX": 1.76412426E12, "maxY": 28493.716666666667, "series": [{"data": [[1.76412426E12, 28493.716666666667]], "isOverall": false, "label": "Bytes received per second", "isController": false}, {"data": [[1.76412426E12, 2741.2]], "isOverall": false, "label": "Bytes sent per second", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76412426E12, "title": "Bytes Throughput Over Time"}},
        getOptions : function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity) ,
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Bytes / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendBytesThroughputOverTime'
                },
                selection: {
                    mode: "xy"
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y"
                }
            };
        },
        createGraph : function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesBytesThroughputOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotBytesThroughputOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewBytesThroughputOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Bytes throughput Over Time
function refreshBytesThroughputOverTime(fixTimestamps) {
    var infos = bytesThroughputOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotBytesThroughputOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesBytesThroughputOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotBytesThroughputOverTime", "#overviewBytesThroughputOverTime");
        $('#footerBytesThroughputOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var responseTimesOverTimeInfos = {
        data: {"result": {"minY": 10474.812999999993, "minX": 1.76412426E12, "maxY": 10474.812999999993, "series": [{"data": [[1.76412426E12, 10474.812999999993]], "isOverall": false, "label": "Warm-up: Search Flights", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76412426E12, "title": "Response Time Over Time"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average response time was %y ms"
                }
            };
        },
        createGraph: function() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Times Over Time
function refreshResponseTimeOverTime(fixTimestamps) {
    var infos = responseTimesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyResponseTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotResponseTimesOverTime"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimesOverTime", "#overviewResponseTimesOverTime");
        $('#footerResponseTimesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var latenciesOverTimeInfos = {
        data: {"result": {"minY": 10061.570000000009, "minX": 1.76412426E12, "maxY": 10061.570000000009, "series": [{"data": [[1.76412426E12, 10061.570000000009]], "isOverall": false, "label": "Warm-up: Search Flights", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76412426E12, "title": "Latencies Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average response latencies in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendLatenciesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average latency was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesLatenciesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotLatenciesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewLatenciesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Latencies Over Time
function refreshLatenciesOverTime(fixTimestamps) {
    var infos = latenciesOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyLatenciesOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotLatenciesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesLatenciesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotLatenciesOverTime", "#overviewLatenciesOverTime");
        $('#footerLatenciesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var connectTimeOverTimeInfos = {
        data: {"result": {"minY": 5033.116999999997, "minX": 1.76412426E12, "maxY": 5033.116999999997, "series": [{"data": [[1.76412426E12, 5033.116999999997]], "isOverall": false, "label": "Warm-up: Search Flights", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76412426E12, "title": "Connect Time Over Time"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getConnectTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Average Connect Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendConnectTimeOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Average connect time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesConnectTimeOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotConnectTimeOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewConnectTimeOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Connect Time Over Time
function refreshConnectTimeOverTime(fixTimestamps) {
    var infos = connectTimeOverTimeInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyConnectTimeOverTime");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotConnectTimeOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesConnectTimeOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotConnectTimeOverTime", "#overviewConnectTimeOverTime");
        $('#footerConnectTimeOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var responseTimePercentilesOverTimeInfos = {
        data: {"result": {"minY": 1.7976931348623157E308, "minX": 1.7976931348623157E308, "maxY": 4.9E-324, "series": [{"data": [], "isOverall": false, "label": "Max", "isController": false}, {"data": [], "isOverall": false, "label": "Min", "isController": false}, {"data": [], "isOverall": false, "label": "90th percentile", "isController": false}, {"data": [], "isOverall": false, "label": "99th percentile", "isController": false}, {"data": [], "isOverall": false, "label": "Median", "isController": false}, {"data": [], "isOverall": false, "label": "95th percentile", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 4.9E-324, "title": "Response Time Percentiles Over Time (successful requests only)"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true,
                        fill: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Response Time in ms",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: '#legendResponseTimePercentilesOverTime'
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s : at %x Response time was %y ms"
                }
            };
        },
        createGraph: function () {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesResponseTimePercentilesOverTime"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotResponseTimePercentilesOverTime"), dataset, options);
            // setup overview
            $.plot($("#overviewResponseTimePercentilesOverTime"), dataset, prepareOverviewOptions(options));
        }
};

// Response Time Percentiles Over Time
function refreshResponseTimePercentilesOverTime(fixTimestamps) {
    var infos = responseTimePercentilesOverTimeInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotResponseTimePercentilesOverTime"))) {
        infos.createGraph();
    }else {
        var choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimePercentilesOverTime", "#overviewResponseTimePercentilesOverTime");
        $('#footerResponseTimePercentilesOverTime .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var responseTimeVsRequestInfos = {
    data: {"result": {"minY": 2638.0, "minX": 1.0, "maxY": 14615.5, "series": [{"data": [[4.0, 8489.0], [16.0, 2638.0], [1.0, 8358.0], [65.0, 13644.0], [584.0, 8045.0], [158.0, 9997.0], [12.0, 8385.5], [50.0, 9839.0], [110.0, 14615.5]], "isOverall": false, "label": "Failures", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 584.0, "title": "Response Time Vs Request"}},
    getOptions: function() {
        return {
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Response Time in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: {
                noColumns: 2,
                show: true,
                container: '#legendResponseTimeVsRequest'
            },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median response time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesResponseTimeVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotResponseTimeVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewResponseTimeVsRequest"), dataset, prepareOverviewOptions(options));

    }
};

// Response Time vs Request
function refreshResponseTimeVsRequest() {
    var infos = responseTimeVsRequestInfos;
    prepareSeries(infos.data);
    if (isGraph($("#flotResponseTimeVsRequest"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesResponseTimeVsRequest");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotResponseTimeVsRequest", "#overviewResponseTimeVsRequest");
        $('#footerResponseRimeVsRequest .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};


var latenciesVsRequestInfos = {
    data: {"result": {"minY": 0.0, "minX": 1.0, "maxY": 13612.0, "series": [{"data": [[4.0, 0.0], [16.0, 0.0], [1.0, 0.0], [65.0, 12567.0], [584.0, 7880.0], [158.0, 9560.5], [12.0, 8385.0], [50.0, 9321.0], [110.0, 13612.0]], "isOverall": false, "label": "Failures", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 1000, "maxX": 584.0, "title": "Latencies Vs Request"}},
    getOptions: function() {
        return{
            series: {
                lines: {
                    show: false
                },
                points: {
                    show: true
                }
            },
            xaxis: {
                axisLabel: "Global number of requests per second",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            yaxis: {
                axisLabel: "Median Latency in ms",
                axisLabelUseCanvas: true,
                axisLabelFontSizePixels: 12,
                axisLabelFontFamily: 'Verdana, Arial',
                axisLabelPadding: 20,
            },
            legend: { noColumns: 2,show: true, container: '#legendLatencyVsRequest' },
            selection: {
                mode: 'xy'
            },
            grid: {
                hoverable: true // IMPORTANT! this is needed for tooltip to work
            },
            tooltip: true,
            tooltipOpts: {
                content: "%s : Median Latency time at %x req/s was %y ms"
            },
            colors: ["#9ACD32", "#FF6347"]
        };
    },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesLatencyVsRequest"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotLatenciesVsRequest"), dataset, options);
        // setup overview
        $.plot($("#overviewLatenciesVsRequest"), dataset, prepareOverviewOptions(options));
    }
};

// Latencies vs Request
function refreshLatenciesVsRequest() {
        var infos = latenciesVsRequestInfos;
        prepareSeries(infos.data);
        if(isGraph($("#flotLatenciesVsRequest"))){
            infos.createGraph();
        }else{
            var choiceContainer = $("#choicesLatencyVsRequest");
            createLegend(choiceContainer, infos);
            infos.createGraph();
            setGraphZoomable("#flotLatenciesVsRequest", "#overviewLatenciesVsRequest");
            $('#footerLatenciesVsRequest .legendColorBox > div').each(function(i){
                $(this).clone().prependTo(choiceContainer.find("li").eq(i));
            });
        }
};

var hitsPerSecondInfos = {
        data: {"result": {"minY": 16.666666666666668, "minX": 1.76412426E12, "maxY": 16.666666666666668, "series": [{"data": [[1.76412426E12, 16.666666666666668]], "isOverall": false, "label": "hitsPerSecond", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76412426E12, "title": "Hits Per Second"}},
        getOptions: function() {
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of hits / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendHitsPerSecond"
                },
                selection: {
                    mode : 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y.2 hits/sec"
                }
            };
        },
        createGraph: function createGraph() {
            var data = this.data;
            var dataset = prepareData(data.result.series, $("#choicesHitsPerSecond"));
            var options = this.getOptions();
            prepareOptions(options, data);
            $.plot($("#flotHitsPerSecond"), dataset, options);
            // setup overview
            $.plot($("#overviewHitsPerSecond"), dataset, prepareOverviewOptions(options));
        }
};

// Hits per second
function refreshHitsPerSecond(fixTimestamps) {
    var infos = hitsPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if (isGraph($("#flotHitsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesHitsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotHitsPerSecond", "#overviewHitsPerSecond");
        $('#footerHitsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
}

var codesPerSecondInfos = {
        data: {"result": {"minY": 0.35, "minX": 1.76412426E12, "maxY": 13.066666666666666, "series": [{"data": [[1.76412426E12, 13.066666666666666]], "isOverall": false, "label": "500", "isController": false}, {"data": [[1.76412426E12, 3.25]], "isOverall": false, "label": "504", "isController": false}, {"data": [[1.76412426E12, 0.35]], "isOverall": false, "label": "Non HTTP response code: java.net.SocketException", "isController": false}], "supportsControllersDiscrimination": false, "granularity": 60000, "maxX": 1.76412426E12, "title": "Codes Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of responses / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendCodesPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "Number of Response Codes %s at %x was %y.2 responses / sec"
                }
            };
        },
    createGraph: function() {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesCodesPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotCodesPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewCodesPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Codes per second
function refreshCodesPerSecond(fixTimestamps) {
    var infos = codesPerSecondInfos;
    prepareSeries(infos.data);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotCodesPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesCodesPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotCodesPerSecond", "#overviewCodesPerSecond");
        $('#footerCodesPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var transactionsPerSecondInfos = {
        data: {"result": {"minY": 16.666666666666668, "minX": 1.76412426E12, "maxY": 16.666666666666668, "series": [{"data": [[1.76412426E12, 16.666666666666668]], "isOverall": false, "label": "Warm-up: Search Flights-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76412426E12, "title": "Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTransactionsPerSecond"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                }
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTransactionsPerSecond"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTransactionsPerSecond"), dataset, options);
        // setup overview
        $.plot($("#overviewTransactionsPerSecond"), dataset, prepareOverviewOptions(options));
    }
};

// Transactions per second
function refreshTransactionsPerSecond(fixTimestamps) {
    var infos = transactionsPerSecondInfos;
    prepareSeries(infos.data);
    if(infos.data.result.series.length == 0) {
        setEmptyGraph("#bodyTransactionsPerSecond");
        return;
    }
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotTransactionsPerSecond"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTransactionsPerSecond");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTransactionsPerSecond", "#overviewTransactionsPerSecond");
        $('#footerTransactionsPerSecond .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

var totalTPSInfos = {
        data: {"result": {"minY": 16.666666666666668, "minX": 1.76412426E12, "maxY": 16.666666666666668, "series": [{"data": [], "isOverall": false, "label": "Transaction-success", "isController": false}, {"data": [[1.76412426E12, 16.666666666666668]], "isOverall": false, "label": "Transaction-failure", "isController": false}], "supportsControllersDiscrimination": true, "granularity": 60000, "maxX": 1.76412426E12, "title": "Total Transactions Per Second"}},
        getOptions: function(){
            return {
                series: {
                    lines: {
                        show: true
                    },
                    points: {
                        show: true
                    }
                },
                xaxis: {
                    mode: "time",
                    timeformat: getTimeFormat(this.data.result.granularity),
                    axisLabel: getElapsedTimeLabel(this.data.result.granularity),
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20,
                },
                yaxis: {
                    axisLabel: "Number of transactions / sec",
                    axisLabelUseCanvas: true,
                    axisLabelFontSizePixels: 12,
                    axisLabelFontFamily: 'Verdana, Arial',
                    axisLabelPadding: 20
                },
                legend: {
                    noColumns: 2,
                    show: true,
                    container: "#legendTotalTPS"
                },
                selection: {
                    mode: 'xy'
                },
                grid: {
                    hoverable: true // IMPORTANT! this is needed for tooltip to
                                    // work
                },
                tooltip: true,
                tooltipOpts: {
                    content: "%s at %x was %y transactions / sec"
                },
                colors: ["#9ACD32", "#FF6347"]
            };
        },
    createGraph: function () {
        var data = this.data;
        var dataset = prepareData(data.result.series, $("#choicesTotalTPS"));
        var options = this.getOptions();
        prepareOptions(options, data);
        $.plot($("#flotTotalTPS"), dataset, options);
        // setup overview
        $.plot($("#overviewTotalTPS"), dataset, prepareOverviewOptions(options));
    }
};

// Total Transactions per second
function refreshTotalTPS(fixTimestamps) {
    var infos = totalTPSInfos;
    // We want to ignore seriesFilter
    prepareSeries(infos.data, false, true);
    if(fixTimestamps) {
        fixTimeStamps(infos.data.result.series, -28800000);
    }
    if(isGraph($("#flotTotalTPS"))){
        infos.createGraph();
    }else{
        var choiceContainer = $("#choicesTotalTPS");
        createLegend(choiceContainer, infos);
        infos.createGraph();
        setGraphZoomable("#flotTotalTPS", "#overviewTotalTPS");
        $('#footerTotalTPS .legendColorBox > div').each(function(i){
            $(this).clone().prependTo(choiceContainer.find("li").eq(i));
        });
    }
};

// Collapse the graph matching the specified DOM element depending the collapsed
// status
function collapse(elem, collapsed){
    if(collapsed){
        $(elem).parent().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else {
        $(elem).parent().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");
        if (elem.id == "bodyBytesThroughputOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshBytesThroughputOverTime(true);
            }
            document.location.href="#bytesThroughputOverTime";
        } else if (elem.id == "bodyLatenciesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesOverTime(true);
            }
            document.location.href="#latenciesOverTime";
        } else if (elem.id == "bodyCustomGraph") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCustomGraph(true);
            }
            document.location.href="#responseCustomGraph";
        } else if (elem.id == "bodyConnectTimeOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshConnectTimeOverTime(true);
            }
            document.location.href="#connectTimeOverTime";
        } else if (elem.id == "bodyResponseTimePercentilesOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimePercentilesOverTime(true);
            }
            document.location.href="#responseTimePercentilesOverTime";
        } else if (elem.id == "bodyResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeDistribution();
            }
            document.location.href="#responseTimeDistribution" ;
        } else if (elem.id == "bodySyntheticResponseTimeDistribution") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshSyntheticResponseTimeDistribution();
            }
            document.location.href="#syntheticResponseTimeDistribution" ;
        } else if (elem.id == "bodyActiveThreadsOverTime") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshActiveThreadsOverTime(true);
            }
            document.location.href="#activeThreadsOverTime";
        } else if (elem.id == "bodyTimeVsThreads") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTimeVsThreads();
            }
            document.location.href="#timeVsThreads" ;
        } else if (elem.id == "bodyCodesPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshCodesPerSecond(true);
            }
            document.location.href="#codesPerSecond";
        } else if (elem.id == "bodyTransactionsPerSecond") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTransactionsPerSecond(true);
            }
            document.location.href="#transactionsPerSecond";
        } else if (elem.id == "bodyTotalTPS") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshTotalTPS(true);
            }
            document.location.href="#totalTPS";
        } else if (elem.id == "bodyResponseTimeVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshResponseTimeVsRequest();
            }
            document.location.href="#responseTimeVsRequest";
        } else if (elem.id == "bodyLatenciesVsRequest") {
            if (isGraph($(elem).find('.flot-chart-content')) == false) {
                refreshLatenciesVsRequest();
            }
            document.location.href="#latencyVsRequest";
        }
    }
}

/*
 * Activates or deactivates all series of the specified graph (represented by id parameter)
 * depending on checked argument.
 */
function toggleAll(id, checked){
    var placeholder = document.getElementById(id);

    var cases = $(placeholder).find(':checkbox');
    cases.prop('checked', checked);
    $(cases).parent().children().children().toggleClass("legend-disabled", !checked);

    var choiceContainer;
    if ( id == "choicesBytesThroughputOverTime"){
        choiceContainer = $("#choicesBytesThroughputOverTime");
        refreshBytesThroughputOverTime(false);
    } else if(id == "choicesResponseTimesOverTime"){
        choiceContainer = $("#choicesResponseTimesOverTime");
        refreshResponseTimeOverTime(false);
    }else if(id == "choicesResponseCustomGraph"){
        choiceContainer = $("#choicesResponseCustomGraph");
        refreshCustomGraph(false);
    } else if ( id == "choicesLatenciesOverTime"){
        choiceContainer = $("#choicesLatenciesOverTime");
        refreshLatenciesOverTime(false);
    } else if ( id == "choicesConnectTimeOverTime"){
        choiceContainer = $("#choicesConnectTimeOverTime");
        refreshConnectTimeOverTime(false);
    } else if ( id == "choicesResponseTimePercentilesOverTime"){
        choiceContainer = $("#choicesResponseTimePercentilesOverTime");
        refreshResponseTimePercentilesOverTime(false);
    } else if ( id == "choicesResponseTimePercentiles"){
        choiceContainer = $("#choicesResponseTimePercentiles");
        refreshResponseTimePercentiles();
    } else if(id == "choicesActiveThreadsOverTime"){
        choiceContainer = $("#choicesActiveThreadsOverTime");
        refreshActiveThreadsOverTime(false);
    } else if ( id == "choicesTimeVsThreads"){
        choiceContainer = $("#choicesTimeVsThreads");
        refreshTimeVsThreads();
    } else if ( id == "choicesSyntheticResponseTimeDistribution"){
        choiceContainer = $("#choicesSyntheticResponseTimeDistribution");
        refreshSyntheticResponseTimeDistribution();
    } else if ( id == "choicesResponseTimeDistribution"){
        choiceContainer = $("#choicesResponseTimeDistribution");
        refreshResponseTimeDistribution();
    } else if ( id == "choicesHitsPerSecond"){
        choiceContainer = $("#choicesHitsPerSecond");
        refreshHitsPerSecond(false);
    } else if(id == "choicesCodesPerSecond"){
        choiceContainer = $("#choicesCodesPerSecond");
        refreshCodesPerSecond(false);
    } else if ( id == "choicesTransactionsPerSecond"){
        choiceContainer = $("#choicesTransactionsPerSecond");
        refreshTransactionsPerSecond(false);
    } else if ( id == "choicesTotalTPS"){
        choiceContainer = $("#choicesTotalTPS");
        refreshTotalTPS(false);
    } else if ( id == "choicesResponseTimeVsRequest"){
        choiceContainer = $("#choicesResponseTimeVsRequest");
        refreshResponseTimeVsRequest();
    } else if ( id == "choicesLatencyVsRequest"){
        choiceContainer = $("#choicesLatencyVsRequest");
        refreshLatenciesVsRequest();
    }
    var color = checked ? "black" : "#818181";
    if(choiceContainer != null) {
        choiceContainer.find("label").each(function(){
            this.style.color = color;
        });
    }
}

